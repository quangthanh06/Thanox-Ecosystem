import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { isAccountLikeProduct } from '../utils/productAccount';
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
  TransactionType,
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
  ProductPackage,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_USERS,
  INITIAL_TOPUPS,
  INITIAL_TRANSACTIONS,
  INITIAL_AFFILIATES,
  INITIAL_AFFILIATE_REWARDS,
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
  removeFromCart: (productId: string, packageId?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, packageId?: string) => void;
  clearCart: () => void;
  checkoutCart: (paymentMethod: Order['paymentMethod']) => Promise<boolean>;

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
  isAuthLoading: boolean;

  // Auth Actions
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string; otp?: string }>;
  resetPassword: (email: string, otpOrToken: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  adminResetPassword: (userId: string, newPass: string) => Promise<{ success: boolean; message: string }>;
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
  createOrder: (productId: string, quantity: number, paymentMethod: Order['paymentMethod'], selectedPackage?: ProductPackage) => Promise<{ success: boolean; order?: Order; error?: string }>;

  approveTopup: (id: string) => void;
  rejectTopup: (id: string, reason: string) => void;
  createTopupRequest: (amount: number, method: TopupRequest['method'], transferNote: string, proofImage?: string) => string;

  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  adjustUserBalance: (userId: string, amount: number, note: string) => void;
  refundOrder: (orderId: string, reason: string) => Promise<boolean>;
  toggleBanUser: (id: string) => void;

  sendTicketMessage: (ticketId: string, message: string, sender?: 'admin' | 'user') => void;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => void;
  createSupportTicket: (subject: string, category: string, message: string, relatedOrderCode?: string) => string;
  createTicket: (subject: string, message: string) => string;
  addTicketMessage: (ticketId: string, message: string) => void;

  getItemEffectivePrice: (product: Product, user?: User | null, selectedPlan?: ProductPackage) => number;
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

// ============================================================================
// SUPABASE PRODUCTS EXTENDED COLUMNS (packages, sale, product_type, ...)
// null = chưa probe, true = đã chạy migration (cột tồn tại), false = chưa có cột
// ============================================================================
let productsExtendedReady: boolean | null = null;

const isMissingColumnError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  const code = String(e.code || '');
  const msg = String(e.message || '');
  return code === 'PGRST204' || code === '42703' || /does not exist|Could not find the '(packages|product_type|is_sale|sale_price|instructions|accounts_list|images|download_url)'/i.test(msg);
};

// Payload các cột mở rộng (lưu giữ đầy đủ keys/downloadUrl của từng gói để RPC create_order_atomic cấp phát tự động)
const sanitizePackages = (pkgs?: ProductPackage[]): ProductPackage[] =>
  (pkgs || []).map((x) => ({
    id: x.id,
    name: x.name,
    price: x.price,
    originalPrice: x.originalPrice,
    sellerPrice: x.sellerPrice,
    keys: x.keys,
    downloadUrl: x.downloadUrl,
  } as ProductPackage));

const buildExtendedProductPayload = (p: Product): Record<string, unknown> => ({
  packages: sanitizePackages(p.packages && p.packages.length > 0 ? p.packages : p.plans),
  product_type: p.productType || 'key',
  is_sale: Boolean(p.isSale ?? p.saleActive),
  sale_price: p.salePrice ?? null,
  instructions: p.instructions || '',
  accounts_list: p.accountsList || '',
  images: p.images || [],
  download_url: p.downloadUrl || '',
  featured: p.featured ?? true,
  sold_count: p.soldCount ?? p.sold ?? 0,
});

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
  // Ref giữ productPackages MỚI NHẤT (tránh race giữa effect tải store_settings
  // và effect tải products — bản tải sau không được đè mất gói của bản trước)
  const productPackagesRef = React.useRef<Record<string, ProductPackage[]>>({});

  const [products, setProducts] = useState<Product[]>(() => {
    const loaded = safeGetItem<Product[] | null>('thanox_products', null);
    if (loaded && Array.isArray(loaded) && loaded.length > 0) {
      return loaded;
    }
    return INITIAL_PRODUCTS;
  });

  // Supabase Data Sync: Products
  useEffect(() => {
    const fetchSupabaseProducts = async () => {
      try {
        // Probe 1 lần: kiểm tra cột mở rộng (packages...) đã tồn tại trên DB chưa
        const { error: probeError } = await supabase.from('products').select('packages').limit(1);
        productsExtendedReady = !probeError;

        // Đọc qua VIEW công khai (không chứa cột key/acc bí mật — moc_b_core.sql)
        const { data, error } = await supabase
          .from('products_public')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data && data.length > 0) {
          // Bản localStorage (do admin cấu hình) dùng để bổ sung các trường
          // mà DB chưa có cột (packages, sale, instructions...) — tránh mất dữ liệu
          // trình duyệt đang dùng trước khi migration được chạy.
          const localSnapshot = products;
          // Gói dịch vụ đồng bộ qua store_settings (cloud, hoạt động cả khi chưa migration)
          // Ưu tiên ref (mới nhất) rồi tới state closure (từ localStorage)
          const cloudPackages = { ...(settings.productPackages || {}), ...productPackagesRef.current };

          const mappedProducts: Product[] = data.map((p) => {
            const local = localSnapshot.find((lp) => lp.id === p.id);
            const dbPackages = Array.isArray(p.packages) ? (p.packages as ProductPackage[]) : [];
            const settingsPkgs = cloudPackages[p.id] || [];
            const localPkgs = local?.packages || local?.plans || [];
            const packages = dbPackages.length > 0 ? dbPackages : settingsPkgs.length > 0 ? settingsPkgs : localPkgs;

            return {
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            sellerPrice: p.sellerPrice ?? p.seller_price,
            basePrice: p.original_price,
            stock: p.stock === 'unlimited' ? 'unlimited' : Number(p.stock) || 0,
            status: p.status as ProductStatus,
            description: p.description || '',
            image: p.image_url || local?.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
            // ONLY LOAD FOR ADMIN! We will fix this in RLS later.
            downloadLinkOrKeys: p.hidden_keys_or_links || local?.downloadLinkOrKeys || '',
            soldCount: (() => {
              const raw = p.sold_count ?? local?.soldCount;
              if (raw && raw > 0) return raw;
              let hash = 0;
              for (let i = 0; i < p.id.length; i++) hash = (hash << 5) - hash + p.id.charCodeAt(i);
              return (Math.abs(hash) % 28) + 18;
            })(),
            sold: (() => {
              const raw = p.sold_count ?? local?.soldCount;
              if (raw && raw > 0) return raw;
              let hash = 0;
              for (let i = 0; i < p.id.length; i++) hash = (hash << 5) - hash + p.id.charCodeAt(i);
              return (Math.abs(hash) % 28) + 18;
            })(),
            featured: p.featured ?? local?.featured ?? true,
            // === Trường mở rộng: ưu tiên DB, fallback về bản localStorage ===
            packages,
            plans: packages,
            productType: (p.product_type as Product['productType']) || local?.productType,
            isSale: p.is_sale ?? local?.isSale,
            saleActive: p.is_sale ?? local?.saleActive,
            salePrice: p.sale_price ?? local?.salePrice,
            instructions: p.instructions || local?.instructions || '',
            accountsList: p.accounts_list || local?.accountsList || '',
            images: Array.isArray(p.images) ? (p.images as string[]) : local?.images,
            downloadUrl: p.download_url || local?.downloadUrl || '',
            licenseKeys: local?.licenseKeys || '',
            attachedFileName: local?.attachedFileName || '',
            attachedFileSize: local?.attachedFileSize || '',
            attachedFileData: local?.attachedFileData || '',
            };
          });
          
          setProducts(mappedProducts);
        }
      } catch (err) {
        console.error('Lỗi tải sản phẩm từ Supabase:', err);
      }
    };
    
    const fetchSupabaseUsers = async () => {
        try {
          // Query 'profiles' table (not 'users') — Supabase Auth trigger creates
          // rows in profiles, not a separate users table.
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            // Fallback: try legacy 'users' table if profiles doesn't exist
            const { data: legacyData, error: legacyErr } = await supabase
              .from('users')
              .select('*')
              .order('created_at', { ascending: false });
            if (legacyErr) throw legacyErr;
            if (legacyData && legacyData.length > 0) {
              const mappedUsers: User[] = legacyData.map((u) => ({
                id: u.id,
                username: u.username,
                email: u.email,
                password: u.password || '***',
                role: u.role as 'admin' | 'user',
                balance: Number(u.balance) || 0,
                totalSpent: Number(u.total_spent) || 0,
                status: (u.status as 'active' | 'banned') || 'active',
                createdAt: u.created_at,
                joinDate: new Date(u.created_at).toISOString().replace('T', ' ').substring(0, 16),
                totalOrders: Number(u.total_orders) || 0,
              }));
              setUsers(mappedUsers);
            }
            return;
          }
          
          if (data && data.length > 0) {
            const mappedUsers: User[] = data.map((u) => ({
              id: u.id,
              username: u.username,
              email: u.email,
              password: u.password || '***',
              role: u.role as 'admin' | 'user',
              balance: Number(u.balance) || 0,
              totalSpent: Number(u.total_spent) || 0,
              status: (u.status as 'active' | 'banned') || 'active',
              createdAt: u.created_at,
              joinDate: new Date(u.created_at).toISOString().replace('T', ' ').substring(0, 16),
              totalOrders: Number(u.total_orders) || 0,
            }));
            
            setUsers(mappedUsers);
          }
        } catch (err) {
          console.error('Lỗi tải Users từ Supabase:', err);
        }
      };

      const fetchSupabaseTopups = async () => {
        try {
          const { data: topupsData, error: topupsErr } = await supabase
            .from('topups')
            .select('*')
            .order('created_at', { ascending: false });

          if (!topupsErr && topupsData && topupsData.length > 0) {
            const { data: profilesData } = await supabase.from('profiles').select('id, username');
            const userMap = new Map();
            profilesData?.forEach((p) => userMap.set(p.id, p.username));

            const now = Date.now();
            const mappedTopups: TopupRequest[] = topupsData.map((t: any) => {
              let status = (t.status as 'pending' | 'approved' | 'rejected') || 'pending';
              // Tự động bỏ qua các đơn pending cũ quá 10 phút để không kẹt trên giao diện Admin
              if (status === 'pending' && t.created_at) {
                const createdTime = new Date(t.created_at).getTime();
                if (Number.isFinite(createdTime) && now - createdTime > 600000) {
                  status = 'rejected';
                }
              }
              return {
                id: t.id,
                requestCode: t.transfer_note || ('#NAP-' + String(t.id).substring(0, 4).toUpperCase()),
                userId: t.user_id,
                userName: userMap.get(t.user_id) || 'Khách',
                amount: Number(t.amount) || 0,
                method: (t.method as 'bank' | 'momo' | 'card') || 'bank',
                status,
                createdAt: t.created_at ? String(t.created_at).replace('T', ' ').substring(0, 16) : '',
                transferNote: t.transfer_note || '',
              };
            });
            
            setTopups((prev) => {
               const merged = [...mappedTopups];
               prev.forEach((p) => {
                 if (!merged.find((m) => m.transferNote === p.transferNote)) merged.push(p);
               });
               return merged;
            });
          }
        } catch (e) {
          console.error('Lỗi tải Topups từ Supabase:', e);
        }
      };

      fetchSupabaseProducts();
      fetchSupabaseUsers();
      fetchSupabaseTopups();
    }, []);

  const [categories, setCategories] = useState<Category[]>(() => {
    const loaded = safeGetItem<Category[]>('thanox_categories', INITIAL_CATEGORIES);
    return Array.isArray(loaded) && loaded.length > 0 ? loaded : INITIAL_CATEGORIES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const loaded = safeGetItem<Order[]>('thanox_orders', INITIAL_ORDERS);
    return Array.isArray(loaded) ? loaded : INITIAL_ORDERS;
  });

  // KHÔNG đọc users từ localStorage — balance phải luôn đến từ Supabase DB
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

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

  // Current active user authentication state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) setCurrentUserId(session.user.id);
      })
      .catch(() => {})
      .finally(() => {
        setIsAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
      } else {
        setCurrentUserId(null);
      }
      setIsAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Realtime Cloud Settings Synchronizer (Sync maintenanceMode, music, payments, etc. across all devices)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('settings_data')
          .eq('id', 'default')
          .maybeSingle();

        if (data?.settings_data && !error) {
          const cloudSettings = data.settings_data;
          setSettings((prev) => {
            const merged = { ...prev, ...cloudSettings };
            try {
              localStorage.setItem('thanox_settings', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      } catch (err) {
        console.warn('[StoreContext] Settings sync error:', err);
      }
    };

    fetchSettings();

    // Supabase Realtime channel for store_settings
    const settingsChannel = supabase
      .channel('store-settings-global-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'store_settings',
          filter: 'id=eq.default',
        },
        (payload: any) => {
          if (payload?.new?.settings_data) {
            const newCloudSettings = payload.new.settings_data;
            setSettings((prev) => {
              const merged = { ...prev, ...newCloudSettings };
              try {
                localStorage.setItem('thanox_settings', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        }
      )
      .subscribe();

    const interval = setInterval(fetchSettings, 4000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  // Tự động load và sync profile mới nhất từ Supabase profiles khi đăng nhập (không giữ balance cũ ở localStorage)
  useEffect(() => {
    if (!currentUserId) return;
    const syncProfile = async () => {
      try {
        const { data: p, error } = await supabase
          .from('profiles')
          .select('id, username, email, balance, total_spent, role, status, created_at, total_orders')
          .eq('id', currentUserId)
          .maybeSingle();

        if (p && !error) {
          setUsers((prev) => {
            const exists = prev.some((u) => u.id === currentUserId);
            if (exists) {
              return prev.map((u) =>
                u.id === currentUserId
                  ? {
                      ...u,
                      username: p.username || u.username,
                      email: p.email || u.email,
                      balance: Number(p.balance) || 0,
                      totalSpent: Number(p.total_spent) || 0,
                      role: (p.role as 'admin' | 'user') || u.role,
                      status: (p.status as 'active' | 'banned') || u.status,
                    }
                  : u
              );
            }
            return [
              ...prev,
              {
                id: p.id,
                username: p.username || 'User',
                email: p.email || '',
                password: '***',
                role: (p.role as 'admin' | 'user') || 'user',
                balance: Number(p.balance) || 0,
                totalSpent: Number(p.total_spent) || 0,
                status: (p.status as 'active' | 'banned') || 'active',
                createdAt: p.created_at,
                joinDate: new Date(p.created_at || Date.now()).toISOString().replace('T', ' ').substring(0, 16),
                totalOrders: Number(p.total_orders) || 0,
              },
            ];
          });
        }
      } catch (err) {
        console.error('[StoreContext] Lỗi đồng bộ profile:', err);
      }
    };
    syncProfile();

    // Lắng nghe Realtime từ Supabase: Bất kỳ thay đổi balance nào dưới DB sẽ lập tức nhảy số trên Header
    const channel = supabase
      .channel(`profile-realtime-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUserId}`,
        },
        (payload: any) => {
          if (payload?.new) {
            const liveBal = Number(payload.new.balance) || 0;
            const liveSpent = Number(payload.new.total_spent) || 0;
            setUsers((prev) =>
              prev.map((u) =>
                u.id === currentUserId
                  ? {
                      ...u,
                      balance: liveBal,
                      totalSpent: liveSpent || u.totalSpent,
                    }
                  : u
              )
            );
          }
        }
      )
      .subscribe();

    // Background sync định kỳ mỗi 2s để đảm bảo số dư Header luôn mới nhất
    const syncInterval = setInterval(syncProfile, 2000);

    // Lắng nghe sự kiện nạp tiền xong để refresh số dư tức thì
    const onBalanceUpdateEvent = () => syncProfile();
    window.addEventListener('thanox:balance_updated', onBalanceUpdateEvent);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('thanox:balance_updated', onBalanceUpdateEvent);
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

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

  // KHÔNG lưu users vào localStorage — tránh cache balance cũ ghi đè số dư mới từ DB
  // (users/balance luôn được load fresh từ Supabase profiles khi mount)

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

  // Load Categories from Supabase Cloud (with fallback to local)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase.from('categories').select('*');
        if (!error && data && data.length > 0) {
          const mapped: Category[] = data.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
            icon: c.icon || '📱',
            image: c.image || '',
            count: Number(c.count) || 0,
            status: (c.status as 'active' | 'hidden') || 'active',
          }));
          setCategories(mapped);
        }
      } catch {}
    };
    fetchCategories();
  }, []);

  // Load User Transactions from Supabase Cloud
  useEffect(() => {
    if (!currentUserId) return;
    const fetchUserTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped: Transaction[] = data.map((t: any) => ({
            id: t.id,
            txCode: t.tx_code || t.id.substring(0, 10),
            userId: t.user_id,
            userName: t.user_name || currentUser.username || 'Khách hàng',
            type: (t.type as TransactionType) || 'deposit',
            amount: Number(t.amount) || 0,
            balanceAfter: Number(t.balance_after) || 0,
            description: t.description || '',
            createdAt: t.created_at || new Date().toISOString(),
            status: (t.status as 'completed' | 'processing' | 'failed') || 'completed',
          }));
          setTransactions(mapped);
        }
      } catch {}
    };
    fetchUserTransactions();
  }, [currentUserId, currentUser.username]);

  // Load Card Recharges from Supabase Cloud
  useEffect(() => {
    const fetchCardRecharges = async () => {
      try {
        let query = supabase.from('card_recharges').select('*');
        if (currentUserId && currentUser?.role !== 'admin') {
          query = query.eq('user_id', currentUserId);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped: CardRechargeRequest[] = data.map((c: any) => ({
            id: c.id,
            code: c.code || `#THE-${c.id.substring(0, 5)}`,
            userId: c.user_id,
            userName: c.user_name || 'Khách hàng',
            network: c.network,
            declaredAmount: Number(c.declared_amount) || 0,
            receivedAmount: Number(c.received_amount) || 0,
            serial: c.serial || '',
            pin: c.pin || '',
            status: c.status || 'pending',
            createdAt: c.created_at || '',
            processedAt: c.processed_at,
            note: c.note,
          }));
          setCardRecharges((prev) => {
            const map = new Map<string, CardRechargeRequest>();
            mapped.forEach((item) => map.set(item.id, item));
            prev.forEach((item) => {
              if (!map.has(item.id)) map.set(item.id, item);
            });
            return Array.from(map.values());
          });
        }
      } catch {}
    };
    fetchCardRecharges();
  }, [currentUserId, currentUser?.role]);

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

  // Mốc B: load đơn hàng CLOUD của user (admin xem hết) — merge với local cũ
  useEffect(() => {
    if (!currentUserId) return;
    (async () => {
      try {
        const isAdmin = users.find((u) => u.id === currentUserId)?.role === 'admin';
        let q = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(300);
        if (!isAdmin) q = q.eq('user_id', currentUserId);
        const { data, error } = await q;
        if (error || !Array.isArray(data)) return; // bảng chưa có (chưa chạy SQL) → im lặng
        const cloud: Order[] = data.map((r) => ({
          id: r.id,
          orderCode: r.order_code,
          userId: r.user_id,
          userName: r.user_name || '',
          userEmail: '',
          productId: r.product_id,
          productName: r.product_name || '',
          category: '',
          quantity: r.quantity ?? 1,
          unitPrice: Number(r.unit_price) || 0,
          totalPrice: Number(r.total_price) || 0,
          totalAmount: Number(r.total_price) || 0,
          paymentMethod: (r.payment_method as Order['paymentMethod']) || 'wallet',
          status: (r.status as Order['status']) || 'completed',
          createdAt: r.created_at ? String(r.created_at).replace('T', ' ').substring(0, 16) : '',
          deliveredContent: r.delivered_content || '',
          packageName: r.package_name || undefined,
        }));
        setOrders((prev) => {
          const cloudIds = new Set(cloud.map((o) => o.id));
          return [...cloud, ...prev.filter((o) => !cloudIds.has(o.id))];
        });
      } catch {}
    })();
  }, [currentUserId]);

  // Load shared store settings from Supabase once on mount so every device
  // (especially mobile) gets the admin-configured music playlist, banner, etc.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Dùng RPC get_public_settings (đã strip secret nhạy cảm ở DB).
        // RPC chưa tồn tại (chưa chạy moc_b_core.sql) → fallback select cũ.
        let cloudSettings: StoreSettings | null = null;
        const { data: rpcData, error: rpcErr } = await supabase.rpc('get_public_settings');
        if (!rpcErr && rpcData && typeof rpcData === 'object') {
          cloudSettings = rpcData as StoreSettings;
        } else {
          const { data, error } = await supabase
            .from('store_settings')
            .select('settings_data, updated_at')
            .eq('id', 'default')
            .maybeSingle();
          if (!error && data?.settings_data && typeof data.settings_data === 'object') {
            cloudSettings = data.settings_data as StoreSettings;
          }
        }
        if (cancelled || !cloudSettings) return;
        setSettings((prev) => ({ ...prev, ...cloudSettings }));

        // Gói dịch vụ admin cấu hình (lưu kèm settings cloud) — áp lên sản phẩm
        // để mọi thiết bị thấy gói ngay cả khi chưa chạy migration cột packages.
        const cloudPkgs = cloudSettings.productPackages || {};
        if (Object.keys(cloudPkgs).length > 0) {
          productPackagesRef.current = { ...productPackagesRef.current, ...cloudPkgs };
          setProducts((prev) =>
            prev.map((p) => {
              const pkgs = cloudPkgs[p.id];
              return pkgs && pkgs.length > 0 ? { ...p, packages: pkgs, plans: pkgs } : p;
            })
          );
        }
      } catch {
        // Offline / table missing: silently keep local settings
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        'wallet', 'transactions', 'affiliate', 'users', 'support', 'settings',
        'theme-settings', 'payment-settings', 'maintenance-settings', 'security-settings', 'music-settings'
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
    } else if (page === 'login') {
      // param = path to return to after successful login (e.g. '/account/wallet/deposit')
      target = param ? `/login?redirect=${encodeURIComponent(param)}` : '/login';
    }
    navigate(target);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const navigateToAdmin = (page: PageId = 'dashboard') => {
    setAppMode('admin');
    setCurrentPage(page);
    const target = page === 'dashboard' ? '/qtri' : `/qtri/${page}`;
    navigate(target);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
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

  const removeFromCart = (productId: string, packageId?: string) => {
    setCart((prev) =>
      prev.filter((item) => {
        if (packageId !== undefined) {
          return !(item.product.id === productId && (item.selectedPackage?.id || '') === packageId);
        }
        return item.product.id !== productId;
      })
    );
    showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
  };

  const updateCartQuantity = (productId: string, quantity: number, packageId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, packageId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        const matches =
          item.product.id === productId &&
          (packageId === undefined || (item.selectedPackage?.id || '') === packageId);
        return matches ? { ...item, quantity } : item;
      })
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

  const checkoutCart = async (paymentMethod: Order['paymentMethod']): Promise<boolean> => {
    if (cart.length === 0) {
      showToast('Giỏ hàng của bạn đang trống!', 'warning');
      return false;
    }

    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập tài khoản để thực hiện thanh toán!', 'warning');
      navigateToStorefront('login', '/cart');
      return false;
    }

    const buyer = currentUser;
    const total = cart.reduce((sum, item) => {
      const price = getItemEffectivePrice(item.product, buyer, item.selectedPackage);
      return sum + price * item.quantity;
    }, 0);

    if (paymentMethod === 'wallet' && buyer.balance < total) {
      showToast(`Số dư ví không đủ! Cần thêm ${(total - buyer.balance).toLocaleString('vi-VN')} VNĐ`, 'error');
      return false;
    }

    // ===== SERVER-SIDE: từng item qua RPC create_order (kiểm giá/stock/ví ở DB).
    // createOrder tự fallback local nếu RPC chưa áp. createOrder tự cập nhật
    // orders/balance thật/notification/toast cho từng đơn. =====
    let created = 0;
    const successfulItems: { productId: string; packageId?: string }[] = [];

    for (const item of cart) {
      const res = await createOrder(item.product.id, item.quantity, paymentMethod, item.selectedPackage);
      if (res?.success) {
        created++;
        successfulItems.push({
          productId: item.product.id,
          packageId: item.selectedPackage?.id,
        });
      } else if (res?.error) {
        showToast(res.error, 'error');
      }
    }

    if (created === 0) {
      showToast('Không thể thanh toán đơn nào — vui lòng kiểm tra lại giỏ hàng!', 'error');
      return false; // Do not navigate or clear cart
    }

    // Affiliate cho đơn đầu tiên của lần checkout này
    processAffiliateRewardForOrder('ord-' + Date.now(), '#TX-' + Math.floor(10000 + Math.random() * 90000), total, buyer);

    // Chỉ xóa các sản phẩm thanh toán thành công khỏi giỏ
    setCart((prev) =>
      prev.filter(
        (item) =>
          !successfulItems.some(
            (s) => s.productId === item.product.id && s.packageId === item.selectedPackage?.id
          )
      )
    );

    if (created < cart.length) {
      showToast(`Thanh toán thành công ${created}/${cart.length} sản phẩm (sản phẩm lỗi vẫn được giữ lại trong giỏ)!`, 'warning');
    }
    return true;
  };

  // Products Server & Local Auto-Sync
  const syncProductsToServer = (updatedProducts: Product[]) => {
    try {
      localStorage.setItem('thanox_products', JSON.stringify(updatedProducts));
    } catch (e) {
      console.error('Failed to save products to localStorage:', e);
    }

        // Sync to Supabase
        /*
        supabase.from('store_settings').upsert({
          id: 'default',
          settings_data: updated,
          updated_at: new Date().toISOString()
        }).catch(err => console.error('Failed to sync settings to cloud', err));
        */

  };

  // Đồng bộ gói dịch vụ của sản phẩm lên Cloud qua bảng store_settings
  // (hoạt động ngay cả khi chưa chạy migration thêm cột packages).
  // packages rỗng => xóa key để mọi thiết bị nhận biết gói đã bị gỡ.
  const syncProductPackagesToCloud = (productId: string, packages: ProductPackage[]) => {
    setSettings((prev) => {
      const map = { ...(prev.productPackages || {}) };
      const safePkgs = sanitizePackages(packages);
      if (safePkgs.length > 0) {
        map[productId] = safePkgs;
      } else {
        delete map[productId];
      }
      // Cập nhật ngay ref để các lần tải sau không đè mất gói vừa lưu
      productPackagesRef.current = { ...productPackagesRef.current, ...map };
      // Đồng bộ LUÔN cột products.packages — RPC create_order đọc từ cột này
      void supabase
        .from('products')
        .update({ packages: map[productId] || [] })
        .eq('id', productId)
        .then((res: { error: { message: string } | null }) => {
          if (res.error) console.warn('[Packages] chưa ghi được cột products:', res.error.message);
        });
      const updated = { ...prev, productPackages: map };
      try {
        localStorage.setItem('thanox_settings', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
      supabase
        .from('store_settings')
        .upsert({
          id: 'default',
          settings_data: updated,
          updated_at: new Date().toISOString(),
        })
        .then(
          (res) => {
            if (res.error) console.error('Failed to sync product packages to cloud:', res.error.message);
          },
          (err: unknown) => console.error('Product packages sync error:', err)
        );
      return updated;
    });
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
      soldCount: Math.floor(Math.random() * 21) + 18,
      sold: Math.floor(Math.random() * 21) + 18,
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
      const baseInsert = {
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
      };
      const extendedPayload = productsExtendedReady === true ? buildExtendedProductPayload(newProduct) : {};

      let { error } = await supabase.from('products').insert({ ...baseInsert, ...extendedPayload });
      // Nếu DB chưa có cột mở rộng (chưa chạy migration) → thử lại không kèm cột mở rộng
      if (error && productsExtendedReady === true && isMissingColumnError(error)) {
        productsExtendedReady = false;
        ({ error } = await supabase.from('products').insert(baseInsert));
      }
      if (error) throw error;
      // Đồng bộ gói dịch vụ lên cloud (qua store_settings) cho mọi thiết bị
      syncProductPackagesToCloud(newId, newProduct.packages || newProduct.plans || []);
      showToast(`Đã thêm sản phẩm "${newProduct.name}" lên Cloud thành công!`, 'success');
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
        const baseUpdate = {
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
        };
        const extendedPayload = productsExtendedReady === true ? buildExtendedProductPayload(p) : {};

        let { error } = await supabase.from('products').update({ ...baseUpdate, ...extendedPayload }).eq('id', id);
        // Nếu DB chưa có cột mở rộng (chưa chạy migration) → thử lại không kèm cột mở rộng
        if (error && productsExtendedReady === true && isMissingColumnError(error)) {
          productsExtendedReady = false;
          ({ error } = await supabase.from('products').update(baseUpdate).eq('id', id));
        }
        if (error) throw error;
        // Đồng bộ gói dịch vụ lên cloud (qua store_settings) cho mọi thiết bị
        syncProductPackagesToCloud(id, p.packages || p.plans || []);
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
      showToast(`🔒 ĐÃ KHÓA "${targetName}"! Sản phẩm này sẽ không bị thay đổi khi hệ thống nâng cấp.`, 'success');
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
      // Dọn gói dịch vụ của sản phẩm đã xóa khỏi store_settings cloud
      syncProductPackagesToCloud(id, []);
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

  // ===== MUA HÀNG SERVER-AUTHORITATIVE (100% SERVER/DATABASE TRANSACTION) =====
  // 100% việc kiểm tra giá, kiểm tra tồn kho, trừ ví profiles, cấp inventory
  // và ghi sổ cái transactions được thực thi trên Serverless API / Postgres.
  const createOrder = async (
    productId: string,
    quantity: number,
    paymentMethod: Order['paymentMethod'],
    selectedPackage?: ProductPackage
  ): Promise<{ success: boolean; order?: Order; error?: string }> => {
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để mua sản phẩm!', 'warning');
      navigateToStorefront('login', typeof window !== 'undefined' ? window.location.pathname : '/products');
      return { success: false, error: 'Chưa đăng nhập' };
    }
    if (settings.maintenanceMode) {
      showToast('Hệ thống đang bảo trì tạm thời, vui lòng quay lại sau!', 'warning');
      return { success: false, error: 'Hệ thống bảo trì' };
    }

    try {
      // Lấy JWT access token nếu có
      let accessToken = '';
      try {
        const sessionRes = await supabase.auth.getSession();
        accessToken = sessionRes?.data?.session?.access_token || '';
      } catch {}

      const idemKey = `ui-${productId}-${selectedPackage?.id ?? 'base'}-${Date.now()}`;

      const res = await fetch('/api/order/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          productId,
          packageId: selectedPackage?.id,
          quantity,
          idempotencyKey: idemKey,
          userId: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.order) {
        const code = data.code || 'UNKNOWN';
        if (code === 'INSUFFICIENT_FUNDS' || code === 'INSUFFICIENT_BALANCE') {
          return { success: false, error: data.error || 'Số dư ví không đủ! Vui lòng nạp thêm tiền.' };
        }
        if (code === 'OUT_OF_STOCK') {
          return { success: false, error: data.error || 'Sản phẩm trong kho đã hết!' };
        }
        if (code === 'USER_BANNED') {
          return { success: false, error: 'Tài khoản của bạn đã bị khóa!' };
        }
        if (code === 'INVALID_PRICE') {
          return { success: false, error: data.error || 'Không thể mua sản phẩm này với giá 0đ' };
        }
        return { success: false, error: data.error || 'Không thể tạo đơn hàng lúc này!' };
      }

      // Thành công trên SERVER — cập nhật UI từ kết quả máy chủ
      const o = data.order;
      const total = Number(o.totalPrice ?? 0);
      const buyer = currentUser;

      const newOrder: Order = {
        id: String(o.id ?? 'ord-' + Date.now()),
        orderCode: String(o.orderCode ?? ''),
        userId: buyer.id,
        userName: buyer.username,
        userEmail: buyer.email,
        productId,
        productName: String(o.productName ?? ''),
        category: (products.find((pr) => pr.id === productId)?.category) || '',
        productCategory: (products.find((pr) => pr.id === productId)?.category) || '',
        quantity: Number(o.quantity ?? 1),
        unitPrice: Number(o.unitPrice ?? total),
        totalPrice: total,
        totalAmount: total,
        paymentMethod,
        status: 'completed',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        deliveredContent: String(o.deliveredContent ?? ''),
        key: String(o.deliveredContent ?? '').split('\n')[0],
        packageName: (o.packageName as string) || selectedPackage?.name,
      };

      setOrders((prev) => [newOrder, ...prev]);

      // 0. Tự động xóa key đã giao ra khỏi kho gói sản phẩm (FIFO Key Pool)
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          const updated = { ...p };
          const qty = Number(o.quantity ?? 1);

          if (selectedPackage && updated.packages && updated.packages.length > 0) {
            updated.packages = updated.packages.map((pkg) => {
              if (pkg.id === selectedPackage.id || pkg.name === selectedPackage.name) {
                const lines = (pkg.keys || '').split('\n').filter((l) => l.trim().length > 0);
                const remaining = lines.slice(qty).join('\n');
                return { ...pkg, keys: remaining };
              }
              return pkg;
            });
            updated.plans = updated.packages;
          } else if (updated.licenseKeys || updated.downloadLinkOrKeys) {
            const currentKeys = updated.licenseKeys || updated.downloadLinkOrKeys || '';
            const lines = currentKeys.split('\n').filter((l) => l.trim().length > 0);
            const remaining = lines.slice(qty).join('\n');
            updated.licenseKeys = remaining;
            updated.downloadLinkOrKeys = remaining;
          } else if (updated.accountsList) {
            const lines = updated.accountsList.split('\n').filter((l) => l.trim().length > 0);
            const remaining = lines.slice(qty).join('\n');
            updated.accountsList = remaining;
          }
          return updated;
        })
      );

      // 1. Cập nhật số dư mới nhất từ server trả về ngay lập tức
      const targetId = currentUserId || buyer.id;
      const newBal = (o.newBalance !== undefined && o.newBalance !== null)
        ? Number(o.newBalance)
        : Math.max(0, buyer.balance - total);

      setUsers((prev) => {
        const exists = prev.some((u) => u.id === targetId || u.id === buyer.id);
        if (exists) {
          return prev.map((u) =>
            u.id === targetId || u.id === buyer.id
              ? {
                  ...u,
                  balance: newBal,
                  totalOrders: (u.totalOrders || 0) + 1,
                  totalSpent: (u.totalSpent || 0) + total,
                }
              : u
          );
        }
        return [
          ...prev,
          {
            ...buyer,
            id: targetId,
            balance: newBal,
            totalOrders: (buyer.totalOrders || 0) + 1,
            totalSpent: (buyer.totalSpent || 0) + total,
          },
        ];
      });

      // 2. Re-fetch profiles.balance từ Supabase để ghi đè chắc chắn 100% khớp database
      void supabase
        .from('profiles')
        .select('id, username, balance, total_spent')
        .eq('id', targetId)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (profile) {
            const dbBal = Number(profile.balance) || 0;
            const dbSpent = Number(profile.total_spent) || 0;
            setUsers((prev) =>
              prev.map((u) =>
                u.id === targetId || u.id === buyer.id
                  ? {
                      ...u,
                      balance: dbBal,
                      totalSpent: dbSpent || u.totalSpent,
                    }
                  : u
              )
            );
          }
        });

      // Cập nhật transactions
      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        txCode: '#GD-' + Math.floor(10000 + Math.random() * 90000),
        type: 'purchase',
        userId: buyer.id,
        userName: buyer.username,
        description: `Thanh toán mua ${newOrder.productName}${newOrder.packageName ? ` [${newOrder.packageName}]` : ''} (x${newOrder.quantity})`,
        amount: -total,
        balanceAfter: newBal,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'completed',
      };
      setTransactions((prev) => [newTx, ...prev]);

      setNotifications((prev) => [
        {
          id: 'notif-' + Date.now(),
          title: `Đơn hàng mới ${newOrder.orderCode}`,
          description: `${buyer.username} vừa mua ${newOrder.productName} (${total.toLocaleString('vi-VN')}đ)`,
          time: 'Vừa xong',
          read: false,
          type: 'order',
        },
        ...prev,
      ]);

      // We will no longer show the toast here because the component will redirect directly
      return { success: true, order: newOrder };
    } catch (err) {
      console.error('[createOrder] Network / API error:', err);
      return { success: false, error: 'Lỗi kết nối máy chủ khi tạo đơn, vui lòng thử lại!' };
    }
  };

  // Topup review actions with double-action prevention
  const approveTopup = async (idOrNote: string) => {
    let targetTopup: TopupRequest | undefined;

    setTopups((prev) => {
      targetTopup = prev.find((t) => t.id === idOrNote || t.requestCode === idOrNote || t.transferNote === idOrNote);
      if (!targetTopup || targetTopup.status === 'approved') return prev;
      return prev.map((t) =>
        t.id === targetTopup!.id || t.transferNote === targetTopup!.transferNote
          ? { ...t, status: 'approved', processedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) }
          : t
      );
    });

    const topup = targetTopup || topups.find((t) => t.id === idOrNote || t.requestCode === idOrNote || t.transferNote === idOrNote);
    if (!topup) {
      showToast('Yêu cầu nạp này không tồn tại hoặc đã được xử lý', 'warning');
      return;
    }

    const targetUserId = topup.userId;
    const addAmount = Number(topup.amount) || 0;

    // 1. Cập nhật số dư User ngay lập tức
    setUsers((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, balance: (Number(u.balance) || 0) + addAmount } : u))
    );

    // 2. Ghi transaction log
    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      txCode: '#GD-' + Math.floor(10000 + Math.random() * 90000),
      type: 'deposit',
      userId: targetUserId,
      userName: topup.userName,
      description: `Nạp tiền qua ${topup.method} (${topup.transferNote})`,
      amount: addAmount,
      balanceAfter: (currentUser.id === targetUserId ? currentUser.balance : 0) + addAmount,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
    };
    setTransactions((prev) => [newTx, ...prev]);

    showToast(`Đã duyệt nạp tiền ${addAmount.toLocaleString('vi-VN')}đ cho ${topup.userName}!`, 'success');

    // 3. ĐỒNG BỘ CLOUD (Bypass RLS qua Serverless API có xác thực Admin)
    try {
      void (async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token || '';
        await fetch('/api/topup/action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            action: 'approve',
            id: topup.id,
            transferNote: topup.transferNote,
            userId: targetUserId,
            amount: addAmount,
          }),
        });
      })();
    } catch {}
  };

  const rejectTopup = (idOrNote: string, reason?: string) => {
    let targetTopup: TopupRequest | undefined;

    setTopups((prev) => {
      targetTopup = prev.find((t) => t.id === idOrNote || t.requestCode === idOrNote || t.transferNote === idOrNote);
      return prev.map((t) =>
        (t.id === idOrNote || t.requestCode === idOrNote || t.transferNote === idOrNote)
          ? { ...t, status: 'rejected' as const, rejectReason: reason || 'Giao dịch không khớp sao kê' }
          : t
      );
    });

    showToast('Đã từ chối yêu cầu nạp tiền', 'error');

    // Đồng bộ lên Cloud qua Serverless API có xác thực Admin
    try {
      void (async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token || '';
        await fetch('/api/topup/action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            action: 'reject',
            id: idOrNote,
            transferNote: targetTopup?.transferNote || idOrNote,
          }),
        });
      })();
    } catch {}
  };

  const createTopupRequest = (
    amount: number,
    method: TopupRequest['method'],
    transferNote: string,
    proofImage?: string
  ): string => {
    const buyer = currentUser;
    // Kill switch: chế độ bảo trì → không nhận nạp mới
    if (settings.maintenanceMode) {
      showToast('Hệ thống đang bảo trì tạm thời — chưa nhận yêu cầu nạp mới!', 'warning');
      return '';
    }
    const generatedCode = '#NAP-' + Math.floor(1000 + Math.random() * 9000);
    const note = transferNote || `${settings.transferPrefix || 'STT'} ${buyer.username.toUpperCase()}`;
    const newTopup: TopupRequest = {
      id: 'topup-' + Date.now(),
      requestCode: generatedCode,
      userId: buyer.id,
      userName: buyer.username,
      amount,
      method,
      proofImage,
      transferNote: note,
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

    // Ghi topup lên Cloud
    void (async () => {
      try {
        await supabase.from('topups').insert({
          user_id: buyer.id,
          amount,
          status: 'pending',
          method,
          transfer_note: newTopup.transferNote,
        });
      } catch {}
    })();

    showToast(
      `Đã tạo yêu cầu nạp ${amount.toLocaleString('vi-VN')}đ (${newTopup.transferNote}). Vui lòng chuyển khoản theo thông tin bên dưới.`,
      'info'
    );
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

    if (currentUser.sellerStatus === 'approved' || currentUser.sellerStatus === 'active') {
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

    // Persist seller application to Supabase profiles
    try {
      supabase
        .from('profiles')
        .update({
          seller_status: 'pending',
          seller_note: note || 'Đăng ký chương trình Đại Lý Thanox',
          seller_applied_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id)
        .then();
    } catch {}

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
    if (!cleanId) return { success: false, message: 'Vui lòng nhập tên đăng nhập hoặc email' };

    // === CHỐNG DÒ MẬT KHẨU (brute force): 5 lần sai liên tiếp => khóa 5 phút ===
    try {
      const raw = localStorage.getItem('thanox_login_guard');
      if (raw) {
        const guard = JSON.parse(raw) as { fails: number; lockedUntil?: number };
        if (guard.lockedUntil && Date.now() < guard.lockedUntil) {
          const secs = Math.ceil((guard.lockedUntil - Date.now()) / 1000);
          return { success: false, message: `Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau ${secs} giây.` };
        }
      }
    } catch {}

    const recordLoginFail = (): { fails: number; lockedUntil?: number } => {
      try {
        const raw = localStorage.getItem('thanox_login_guard');
        const guard = raw ? (JSON.parse(raw) as { fails: number }) : { fails: 0 };
        const fails = (guard.fails || 0) + 1;
        const next = fails >= 5 ? { fails: 0, lockedUntil: Date.now() + 5 * 60 * 1000 } : { fails };
        localStorage.setItem('thanox_login_guard', JSON.stringify(next));
        return next;
      } catch {
        return { fails: 1 };
      }
    };

    try {
      let targetEmail = cleanId;
      if (!cleanId.includes('@')) {
        const { data: profile } = await supabase.from('profiles').select('email').eq('username', cleanId).single();
        if (profile && profile.email) {
          targetEmail = profile.email;
        } else {
          const g = recordLoginFail();
          return { success: false, message: g.lockedUntil ? 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 5 phút.' : `Sai tài khoản hoặc mật khẩu. (Còn ${5 - g.fails} lần thử)` };
        }
      }
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });
      if (authError || !authData.user) {
        const g = recordLoginFail();
        if (g.lockedUntil) {
          return { success: false, message: 'Bạn đã nhập sai quá nhiều lần. Tài khoản bị khóa tạm 5 phút.' };
        }
        // Give users an actionable message for unconfirmed emails instead of a generic one
        if (authError?.message?.toLowerCase().includes('email not confirmed')) {
          return { success: false, message: 'Tài khoản chưa xác nhận email. Vui lòng kiểm tra hộp thư (cả mục Spam) và bấm link kích hoạt.' };
        }
        return { success: false, message: `Sai tài khoản hoặc mật khẩu. (Còn ${5 - g.fails} lần thử)` };
      }

      // Đăng nhập thành công => xóa bộ đếm sai
      try {
        localStorage.removeItem('thanox_login_guard');
      } catch {}

      setCurrentUserId(authData.user.id);
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
      if (profile) {
        const mappedUser: User = {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          password: '***',
          role: profile.role as 'admin' | 'user',
          balance: Number(profile.balance) || 0,
          totalSpent: Number(profile.total_spent) || 0,
          status: profile.status as 'active' | 'banned',
          createdAt: profile.created_at,
          joinDate: new Date(profile.created_at).toISOString().replace('T', ' ').substring(0, 16),
          totalOrders: Number(profile.total_orders) || 0,
        };
        setUsers(prev => {
          const exists = prev.find(u => u.id === mappedUser.id);
          if (exists) return prev.map(u => u.id === mappedUser.id ? mappedUser : u);
          return [...prev, mappedUser];
        });
      }

      return { success: true };
    } catch (err) {
      return { success: false, message: 'Lỗi máy chủ, vui lòng thử lại.' };
    }
  };

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) return { success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự.' };
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) return { success: false, message: 'Tên đăng nhập chỉ bao gồm chữ cái, số và dấu gạch dưới (_).' };
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) return { success: false, message: 'Địa chỉ email không hợp lệ.' };
    if (!password || password.length < 6) return { success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự.' };
    try {
      const { data: existingUser } = await supabase.from('profiles').select('username').eq('username', cleanUsername).single();
      if (existingUser) return { success: false, message: 'Tên đăng nhập đã được sử dụng.' };
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: { data: { username: cleanUsername } }
      });
      if (authError) {
        let msg = 'Đăng ký không thành công.';
        const m = authError.message.toLowerCase();
        if (m.includes('already registered') || m.includes('already been registered')) {
          msg = 'Email này đã được sử dụng.';
        } else if (m.includes('rate limit')) {
          msg = 'Bạn đã đăng ký quá nhiều lần. Vui lòng thử lại sau ít phút.';
        }
        return { success: false, message: msg };
      }
      // Thêm user mới vào local state ngay lập tức để hiển thị trong admin panel
      if (authData.user) {
        const newUser: User = {
          id: authData.user.id,
          username: cleanUsername,
          email: cleanEmail,
          password: '***',
          role: 'user',
          balance: 0,
          totalSpent: 0,
          totalOrders: 0,
          status: 'active',
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          joinDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
        setUsers(prev => {
          const exists = prev.find(u => u.id === newUser.id || u.email === cleanEmail);
          if (exists) return prev;
          return [...prev, newUser];
        });
      }
      showToast('Đăng ký tài khoản thành công! Vui lòng kiểm tra email để kích hoạt tài khoản trước khi đăng nhập.', 'success');
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUserId(null);
    showToast('Đã đăng xuất khỏi hệ thống', 'info');
  };

  // Forgot Password: Email normalization & OTP generation
  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message?: string; otp?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, message: 'Lỗi khi gửi email xác thực.' };
      return { success: true, message: 'Đã gửi email khôi phục mật khẩu.' };
    } catch (err) {
      return { success: false, message: 'Lỗi máy chủ.' };
    }
  };

  const resetPassword = async (email: string, otpOrToken: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otpOrToken, type: 'recovery' });
      if (error) return { success: false, message: 'Mã xác thực không hợp lệ.' };
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) return { success: false, message: 'Không thể cập nhật mật khẩu.' };
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Lỗi máy chủ.' };
    }
  };

  // Admin Direct Password Reset for Customer Assistance
  const adminResetPassword = async (userId: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    if (!newPass || newPass.length < 6) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' };
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || '';

      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId, newPassword: newPass }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errMsg = data?.error || 'Không thể đổi mật khẩu qua Supabase Auth';
        showToast(errMsg, 'error');
        return { success: false, message: errMsg };
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, password: newPass } : u))
      );

      showToast('Đã đặt lại mật khẩu mới cho tài khoản khách hàng thành công!', 'success');
      return { success: true, message: 'Mật khẩu đã được cập nhật thành công trên hệ thống.' };
    } catch (err: any) {
      const errMsg = err?.message || 'Lỗi kết nối máy chủ';
      showToast(errMsg, 'error');
      return { success: false, message: errMsg };
    }
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
        const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', id);
        if (error) {
          // Fallback: try legacy 'users' table
          const { error: legacyErr } = await supabase.from('users').update(dbUpdates).eq('id', id);
          if (legacyErr) throw legacyErr;
        }
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
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) {
        // Fallback: try legacy 'users' table
        const { error: legacyErr } = await supabase.from('users').delete().eq('id', id);
        if (legacyErr) throw legacyErr;
      }
      showToast(`Đã xóa tài khoản ${target.username} trên Cloud thành công`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi xóa tài khoản trên Cloud', 'error');
    }
  };

  const adjustUserBalance = async (userId: string, amount: number, note: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    // SERVER-SIDE: RPC admin_adjust_balance — cộng đúng bảng profiles (số dư thật),
    // khóa dòng, ghi ledger + audit_log. KHÔNG sửa balance trực tiếp ở client.
    try {
      const { data, error } = await supabase.rpc('admin_adjust_balance', {
        p_user_id: userId,
        p_amount: Math.round(amount),
        p_note: note || '',
      });
      if (error) throw error;
      const r = data as { status?: string; code?: string; balance?: number } | null;
      if (r?.status !== 'success') {
        showToast(r?.code === 'FORBIDDEN' ? 'Bạn không có quyền điều chỉnh số dư!' : 'Không thể điều chỉnh số dư (' + (r?.code || 'lỗi') + ')', 'error');
        return;
      }
      const newBalance = Number(r.balance ?? 0);
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
        `Đã ${amount >= 0 ? 'cộng' : 'trừ'} ${Math.abs(amount).toLocaleString('vi-VN')}đ vào ví của ${targetUser.username} (số dư mới: ${newBalance.toLocaleString('vi-VN')}đ)`,
        'success'
      );
    } catch (e) {
      console.error(e);
      showToast('Lỗi điều chỉnh số dư (server)', 'error');
    }
  };

  // ADMIN HOÀN TIỀN ĐƠN CLOUD — RPC admin_refund_order: cộng lại ví đúng 1 lần,
  // đơn -> refunded, ledger REFUND + audit. KHÔNG sửa lịch sử gốc.
  const refundOrder = async (orderId: string, reason: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('admin_refund_order', {
        p_order_id: orderId,
        p_reason: reason || '',
      });
      if (error) throw error;
      const r = data as { status?: string; code?: string; refunded?: number } | null;
      if (r?.status !== 'success') {
        showToast(
          r?.code === 'ALREADY_REFUNDED' ? 'Đơn này đã được hoàn tiền trước đó!' :
          r?.code === 'NOT_REFUNDABLE' ? 'Chỉ hoàn tiền được đơn đã hoàn thành!' :
          r?.code === 'FORBIDDEN' ? 'Bạn không có quyền hoàn tiền!' : 'Không thể hoàn tiền (' + (r?.code || 'lỗi') + ')',
          'error'
        );
        return false;
      }
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'refunded' as const } : o)));
      showToast(`✅ Đã hoàn ${(r.refunded ?? 0).toLocaleString('vi-VN')}đ vào ví khách (ledger REFUND + audit đã ghi)`, 'success');
      return true;
    } catch (e) {
      console.error(e);
      showToast('Lỗi hoàn tiền (server)', 'error');
      return false;
    }
  };

  const toggleBanUser = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const newStatus = user.status === 'active' ? 'banned' : 'active';
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)));
    
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
      if (error) {
        // Fallback: try legacy 'users' table
        const { error: legacyErr } = await supabase.from('users').update({ status: newStatus }).eq('id', id);
        if (legacyErr) throw legacyErr;
      }
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
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
      // Sync settings to Supabase so every device (desktop & mobile) receives
      // the same configuration: music playlist, banner, payments, etc.
      supabase
        .from('store_settings')
        .upsert({
          id: 'default',
          settings_data: updated,
          updated_at: new Date().toISOString(),
        })
        .then(
          (res) => {
            if (res.error) console.error('Failed to sync settings to cloud:', res.error.message);
          },
          (err: unknown) => console.error('Settings sync error:', err)
        );
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

  // Auto expire pending topups older than 5 minutes for current user
  useEffect(() => {
    if (!currentUser) return;
    const timer = setInterval(() => {
      setTopups((prev) => {
        let changed = false;
        const now = Date.now();
        const newTopups = prev.map((t) => {
          if (t.userId === currentUser.id && t.status === 'pending') {
             const createdTime = new Date(t.createdAt.replace(' ', 'T') + ':00Z').getTime();
             if (now - createdTime > 300000) {
                changed = true;
                void supabase.from('topups').update({ status: 'rejected' }).eq('id', t.id);
                return { ...t, status: 'rejected' as const, rejectReason: 'Hết hạn (quá 5 phút)' };
             }
          }
          return t;
        });
        return changed ? newTopups : prev;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, [currentUser]);

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
        isAuthLoading,
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
        refundOrder,
        toggleBanUser,
        sendTicketMessage,
        updateTicketStatus,
        createSupportTicket,
        createTicket,
        addTicketMessage,
        getItemEffectivePrice,
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


