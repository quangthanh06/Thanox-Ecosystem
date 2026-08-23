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
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
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
  createOrder: (productId: string, quantity: number, paymentMethod: Order['paymentMethod'], selectedPackage?: ProductPackage) => Promise<boolean>;

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
// null = chÃ†Â°a probe, true = Ã„â€˜ÃƒÂ£ chÃ¡ÂºÂ¡y migration (cÃ¡Â»â„¢t tÃ¡Â»â€œn tÃ¡ÂºÂ¡i), false = chÃ†Â°a cÃƒÂ³ cÃ¡Â»â„¢t
// ============================================================================
let productsExtendedReady: boolean | null = null;

const isMissingColumnError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  const code = String(e.code || '');
  const msg = String(e.message || '');
  return code === 'PGRST204' || code === '42703' || /does not exist|Could not find the '(packages|product_type|is_sale|sale_price|instructions|accounts_list|images|download_url)'/i.test(msg);
};

// Payload cÃƒÂ¡c cÃ¡Â»â„¢t mÃ¡Â»Å¸ rÃ¡Â»â„¢ng (chÃ¡Â»â€° gÃ¡Â»Â­i khi migration Ã„â€˜ÃƒÂ£ Ã„â€˜Ã†Â°Ã¡Â»Â£c ÃƒÂ¡p dÃ¡Â»Â¥ng)
// Strip key/link bÃƒÂ­ mÃ¡ÂºÂ­t khÃ¡Â»Âi packages trÃ†Â°Ã¡Â»â€ºc khi lÃ†Â°u lÃƒÂªn cloud (cÃ¡Â»â„¢t packages
// public cho UI; key giao hÃƒÂ ng chÃ¡Â»â€° nÃ¡ÂºÂ±m trong hidden_keys_or_links Ã„â€˜ÃƒÂ£ bÃ¡Â»â€¹ thu quyÃ¡Â»Ân)
const sanitizePackages = (pkgs?: ProductPackage[]): ProductPackage[] =>
  (pkgs || []).map((x) => {
    const { keys, downloadUrl, ...rest } = x;
    return rest as ProductPackage;
  });

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
  // Ref giÃ¡Â»Â¯ productPackages MÃ¡Â»Å¡I NHÃ¡ÂºÂ¤T (trÃƒÂ¡nh race giÃ¡Â»Â¯a effect tÃ¡ÂºÂ£i store_settings
  // vÃƒÂ  effect tÃ¡ÂºÂ£i products Ã¢â‚¬â€ bÃ¡ÂºÂ£n tÃ¡ÂºÂ£i sau khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜ÃƒÂ¨ mÃ¡ÂºÂ¥t gÃƒÂ³i cÃ¡Â»Â§a bÃ¡ÂºÂ£n trÃ†Â°Ã¡Â»â€ºc)
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
        // Probe 1 lÃ¡ÂºÂ§n: kiÃ¡Â»Æ’m tra cÃ¡Â»â„¢t mÃ¡Â»Å¸ rÃ¡Â»â„¢ng (packages...) Ã„â€˜ÃƒÂ£ tÃ¡Â»â€œn tÃ¡ÂºÂ¡i trÃƒÂªn DB chÃ†Â°a
        const { error: probeError } = await supabase.from('products').select('packages').limit(1);
        productsExtendedReady = !probeError;

        // Ã„ÂÃ¡Â»Âc qua VIEW cÃƒÂ´ng khai (khÃƒÂ´ng chÃ¡Â»Â©a cÃ¡Â»â„¢t key/acc bÃƒÂ­ mÃ¡ÂºÂ­t Ã¢â‚¬â€ moc_b_core.sql)
        const { data, error } = await supabase
          .from('products_public')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data && data.length > 0) {
          // BÃ¡ÂºÂ£n localStorage (do admin cÃ¡ÂºÂ¥u hÃƒÂ¬nh) dÃƒÂ¹ng Ã„â€˜Ã¡Â»Æ’ bÃ¡Â»â€¢ sung cÃƒÂ¡c trÃ†Â°Ã¡Â»Âng
          // mÃƒÂ  DB chÃ†Â°a cÃƒÂ³ cÃ¡Â»â„¢t (packages, sale, instructions...) Ã¢â‚¬â€ trÃƒÂ¡nh mÃ¡ÂºÂ¥t dÃ¡Â»Â¯ liÃ¡Â»â€¡u
          // trÃƒÂ¬nh duyÃ¡Â»â€¡t Ã„â€˜ang dÃƒÂ¹ng trÃ†Â°Ã¡Â»â€ºc khi migration Ã„â€˜Ã†Â°Ã¡Â»Â£c chÃ¡ÂºÂ¡y.
          const localSnapshot = products;
          // GÃƒÂ³i dÃ¡Â»â€¹ch vÃ¡Â»Â¥ Ã„â€˜Ã¡Â»â€œng bÃ¡Â»â„¢ qua store_settings (cloud, hoÃ¡ÂºÂ¡t Ã„â€˜Ã¡Â»â„¢ng cÃ¡ÂºÂ£ khi chÃ†Â°a migration)
          // Ã†Â¯u tiÃƒÂªn ref (mÃ¡Â»â€ºi nhÃ¡ÂºÂ¥t) rÃ¡Â»â€œi tÃ¡Â»â€ºi state closure (tÃ¡Â»Â« localStorage)
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
            soldCount: p.sold_count ?? local?.soldCount ?? 0,
            featured: p.featured ?? local?.featured ?? true,
            // === TrÃ†Â°Ã¡Â»Âng mÃ¡Â»Å¸ rÃ¡Â»â„¢ng: Ã†Â°u tiÃƒÂªn DB, fallback vÃ¡Â»Â bÃ¡ÂºÂ£n localStorage ===
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
        console.error('LÃ¡Â»â€”i tÃ¡ÂºÂ£i sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m tÃ¡Â»Â« Supabase:', err);
      }
    };
    
    const fetchSupabaseUsers = async () => {
        try {
          // Query 'profiles' table (not 'users') Ã¢â‚¬â€ Supabase Auth trigger creates
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
          console.error('LÃ¡Â»â€”i tÃ¡ÂºÂ£i Users tÃ¡Â»Â« Supabase:', err);
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

            const mappedTopups: TopupRequest[] = topupsData.map((t: any) => ({
              id: t.id,
              requestCode: t.transfer_note || ('#NAP-' + String(t.id).substring(0, 4).toUpperCase()),
              userId: t.user_id,
              userName: userMap.get(t.user_id) || 'KhÃƒÂ¡ch',
              amount: Number(t.amount) || 0,
              method: (t.method as 'bank' | 'momo' | 'card') || 'bank',
              status: (t.status as 'pending' | 'approved' | 'rejected') || 'pending',
              createdAt: t.created_at ? String(t.created_at).replace('T', ' ').substring(0, 16) : '',
              transferNote: t.transfer_note || '',
            }));
            
            setTopups((prev) => {
               const merged = [...mappedTopups];
               prev.forEach((p) => {
                 if (!merged.find((m) => m.transferNote === p.transferNote)) merged.push(p);
               });
               return merged;
            });
          }
        } catch (e) {
          console.error('LÃ¡Â»â€”i tÃ¡ÂºÂ£i Topups tÃ¡Â»Â« Supabase:', e);
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

  // Current active user authentication state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        // fetchSupabaseUsers(); // Removed to prevent TDZ error
      } else {
        setCurrentUserId(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fallbackUser: User = {
    id: 'guest',
    username: 'KhÃƒÂ¡ch',
    name: 'KhÃƒÂ¡ch hÃƒÂ ng',
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
      '%cÃ°Å¸â€ºâ€˜ DÃ¡Â»ÂªNG LÃ¡ÂºÂ I! CÃ¡ÂºÂ¢NH BÃƒÂO BÃ¡ÂºÂ¢O MÃ¡ÂºÂ¬T THANOX Ã°Å¸â€ºâ€˜',
      'color: #EF4444; font-size: 22px; font-weight: bold;'
    );
    console.log(
      '%cÃ„ÂÃƒÂ¢y lÃƒÂ  tÃƒÂ­nh nÃ„Æ’ng dÃƒÂ nh riÃƒÂªng cho nhÃƒÂ  phÃƒÂ¡t triÃ¡Â»Æ’n. TuyÃ¡Â»â€¡t Ã„â€˜Ã¡Â»â€˜i KHÃƒâ€NG dÃƒÂ¡n bÃ¡ÂºÂ¥t kÃ¡Â»Â³ Ã„â€˜oÃ¡ÂºÂ¡n mÃƒÂ£ script nÃƒÂ o vÃƒÂ o Ã„â€˜ÃƒÂ¢y Ã„â€˜Ã¡Â»Æ’ trÃƒÂ¡nh bÃ¡Â»â€¹ hacker Ã„â€˜ÃƒÂ¡nh cÃ¡ÂºÂ¯p tÃƒÂ i khoÃ¡ÂºÂ£n!',
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
        const res = await fetch(`/api/sync?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
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

  // MÃ¡Â»â€˜c B: load Ã„â€˜Ã†Â¡n hÃƒÂ ng CLOUD cÃ¡Â»Â§a user (admin xem hÃ¡ÂºÂ¿t) Ã¢â‚¬â€ merge vÃ¡Â»â€ºi local cÃ…Â©
  useEffect(() => {
    if (!currentUserId) return;
    (async () => {
      try {
        const isAdmin = users.find((u) => u.id === currentUserId)?.role === 'admin';
        let q = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(300);
        if (!isAdmin) q = q.eq('user_id', currentUserId);
        const { data, error } = await q;
        if (error || !Array.isArray(data)) return; // bÃ¡ÂºÂ£ng chÃ†Â°a cÃƒÂ³ (chÃ†Â°a chÃ¡ÂºÂ¡y SQL) Ã¢â€ â€™ im lÃ¡ÂºÂ·ng
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
        // DÃƒÂ¹ng RPC get_public_settings (Ã„â€˜ÃƒÂ£ strip secret nhÃ¡ÂºÂ¡y cÃ¡ÂºÂ£m Ã¡Â»Å¸ DB).
        // RPC chÃ†Â°a tÃ¡Â»â€œn tÃ¡ÂºÂ¡i (chÃ†Â°a chÃ¡ÂºÂ¡y moc_b_core.sql) Ã¢â€ â€™ fallback select cÃ…Â©.
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

        // GÃƒÂ³i dÃ¡Â»â€¹ch vÃ¡Â»Â¥ admin cÃ¡ÂºÂ¥u hÃƒÂ¬nh (lÃ†Â°u kÃƒÂ¨m settings cloud) Ã¢â‚¬â€ ÃƒÂ¡p lÃƒÂªn sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m
        // Ã„â€˜Ã¡Â»Æ’ mÃ¡Â»Âi thiÃ¡ÂºÂ¿t bÃ¡Â»â€¹ thÃ¡ÂºÂ¥y gÃƒÂ³i ngay cÃ¡ÂºÂ£ khi chÃ†Â°a chÃ¡ÂºÂ¡y migration cÃ¡Â»â„¢t packages.
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
    } else if (page === 'login') {
      // param = path to return to after successful login (e.g. '/account/wallet/deposit')
      target = param ? `/login?redirect=${encodeURIComponent(param)}` : '/login';
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
      `Ã„ÂÃƒÂ£ thÃƒÂªm "${product.name}${selectedPackage ? ` [${selectedPackage.name}]` : ''}" vÃƒÂ o giÃ¡Â»Â hÃƒÂ ng!`,
      'success'
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Ã„ÂÃƒÂ£ xÃƒÂ³a sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m khÃ¡Â»Âi giÃ¡Â»Â hÃƒÂ ng', 'info');
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

    // Check minimum qualifying order value (default 200.000Ã„â€˜)
    const minOrderVal = settings.affiliateMinimumOrderValue ?? 200000;
    if (orderTotal < minOrderVal) return;

    // Deduplication: An order can ONLY award affiliate commission ONCE
    const alreadyRewarded = affiliateRewards.some(
      (r) => r.orderId === orderId && r.status === 'completed'
    );
    if (alreadyRewarded) return;

    // Determine reward amount (default: 10.000Ã„â€˜, or higher tier if enabled)
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
      console.log(`[Affiliate] Referrer ${referrer.username} reached daily reward cap of ${dailyCap}Ã„â€˜.`);
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
      description: `Hoa hÃ¡Â»â€œng giÃ¡Â»â€ºi thiÃ¡Â»â€¡u: Ã„ÂÃ†Â¡n ${orderCode} cÃ¡Â»Â§a ${buyer.username} (+${rewardAmount.toLocaleString('vi-VN')}Ã„â€˜ vÃƒÂ o SÃ¡Â»â€˜ DÃ†Â° Affiliate)`,
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
        title: `NhÃ¡ÂºÂ­n thÃ†Â°Ã¡Â»Å¸ng giÃ¡Â»â€ºi thiÃ¡Â»â€¡u +${rewardAmount.toLocaleString('vi-VN')}Ã„â€˜`,
        description: `BÃ¡ÂºÂ¡n vÃ¡Â»Â«a nhÃ¡ÂºÂ­n ${rewardAmount.toLocaleString('vi-VN')}Ã„â€˜ hoa hÃ¡Â»â€œng tÃ¡Â»Â« Ã„â€˜Ã†Â¡n hÃƒÂ ng hÃ¡Â»Â£p lÃ¡Â»â€¡ cÃ¡Â»Â§a ${buyer.username} (${orderCode})`,
        time: 'VÃ¡Â»Â«a xong',
        read: false,
        type: 'system',
      },
      ...prev,
    ]);
  };

  const checkoutCart = async (paymentMethod: Order['paymentMethod']): Promise<boolean> => {
    if (cart.length === 0) {
      showToast('GiÃ¡Â»Â hÃƒÂ ng cÃ¡Â»Â§a bÃ¡ÂºÂ¡n Ã„â€˜ang trÃ¡Â»â€˜ng!', 'warning');
      return false;
    }

    if (!isAuthenticated) {
      showToast('Vui lÃƒÂ²ng Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p tÃƒÂ i khoÃ¡ÂºÂ£n Ã„â€˜Ã¡Â»Æ’ thÃ¡Â»Â±c hiÃ¡Â»â€¡n thanh toÃƒÂ¡n!', 'warning');
      navigateToStorefront('login', '/cart');
      return false;
    }

    const buyer = currentUser;
    const total = cart.reduce((sum, item) => {
      const price = getItemEffectivePrice(item.product, buyer, item.selectedPackage);
      return sum + price * item.quantity;
    }, 0);

    if (paymentMethod === 'wallet' && buyer.balance < total) {
      showToast(`SÃ¡Â»â€˜ dÃ†Â° vÃƒÂ­ khÃƒÂ´ng Ã„â€˜Ã¡Â»Â§! CÃ¡ÂºÂ§n thÃƒÂªm ${(total - buyer.balance).toLocaleString('vi-VN')} VNÃ„Â`, 'error');
      return false;
    }

    // ===== SERVER-SIDE: tÃ¡Â»Â«ng item qua RPC create_order (kiÃ¡Â»Æ’m giÃƒÂ¡/stock/vÃƒÂ­ Ã¡Â»Å¸ DB).
    // createOrder tÃ¡Â»Â± fallback local nÃ¡ÂºÂ¿u RPC chÃ†Â°a ÃƒÂ¡p. createOrder tÃ¡Â»Â± cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t
    // orders/balance thÃ¡ÂºÂ­t/notification/toast cho tÃ¡Â»Â«ng Ã„â€˜Ã†Â¡n. =====
    let created = 0;
    for (const item of cart) {
      const ok = await createOrder(item.product.id, item.quantity, paymentMethod, item.selectedPackage);
      if (ok) created++;
    }

    if (created === 0) {
      showToast('KhÃƒÂ´ng thÃ¡Â»Æ’ thanh toÃƒÂ¡n Ã„â€˜Ã†Â¡n nÃƒÂ o Ã¢â‚¬â€ vui lÃƒÂ²ng kiÃ¡Â»Æ’m tra lÃ¡ÂºÂ¡i giÃ¡Â»Â hÃƒÂ ng!', 'error');
      return false;
    }

    // Affiliate cho Ã„â€˜Ã†Â¡n Ã„â€˜Ã¡ÂºÂ§u tiÃƒÂªn cÃ¡Â»Â§a lÃ¡ÂºÂ§n checkout nÃƒÂ y
    processAffiliateRewardForOrder('ord-' + Date.now(), '#TX-' + Math.floor(10000 + Math.random() * 90000), total, buyer);

    clearCart();
    if (created < cart.length) {
      showToast(`Thanh toÃƒÂ¡n thÃƒÂ nh cÃƒÂ´ng ${created}/${cart.length} sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m (mÃ¡Â»â„¢t sÃ¡Â»â€˜ sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m lÃ¡Â»â€”i/hÃ¡ÂºÂ¿t hÃƒÂ ng)!`, 'warning');
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

  // Ã„ÂÃ¡Â»â€œng bÃ¡Â»â„¢ gÃƒÂ³i dÃ¡Â»â€¹ch vÃ¡Â»Â¥ cÃ¡Â»Â§a sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m lÃƒÂªn Cloud qua bÃ¡ÂºÂ£ng store_settings
  // (hoÃ¡ÂºÂ¡t Ã„â€˜Ã¡Â»â„¢ng ngay cÃ¡ÂºÂ£ khi chÃ†Â°a chÃ¡ÂºÂ¡y migration thÃƒÂªm cÃ¡Â»â„¢t packages).
  // packages rÃ¡Â»â€”ng => xÃƒÂ³a key Ã„â€˜Ã¡Â»Æ’ mÃ¡Â»Âi thiÃ¡ÂºÂ¿t bÃ¡Â»â€¹ nhÃ¡ÂºÂ­n biÃ¡ÂºÂ¿t gÃƒÂ³i Ã„â€˜ÃƒÂ£ bÃ¡Â»â€¹ gÃ¡Â»Â¡.
  const syncProductPackagesToCloud = (productId: string, packages: ProductPackage[]) => {
    setSettings((prev) => {
      const map = { ...(prev.productPackages || {}) };
      const safePkgs = sanitizePackages(packages);
      if (safePkgs.length > 0) {
        map[productId] = safePkgs;
      } else {
        delete map[productId];
      }
      // CÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t ngay ref Ã„â€˜Ã¡Â»Æ’ cÃƒÂ¡c lÃ¡ÂºÂ§n tÃ¡ÂºÂ£i sau khÃƒÂ´ng Ã„â€˜ÃƒÂ¨ mÃ¡ÂºÂ¥t gÃƒÂ³i vÃ¡Â»Â«a lÃ†Â°u
      productPackagesRef.current = { ...productPackagesRef.current, ...map };
      // Ã„ÂÃ¡Â»â€œng bÃ¡Â»â„¢ LUÃƒâ€N cÃ¡Â»â„¢t products.packages Ã¢â‚¬â€ RPC create_order Ã„â€˜Ã¡Â»Âc tÃ¡Â»Â« cÃ¡Â»â„¢t nÃƒÂ y
      void supabase
        .from('products')
        .update({ packages: map[productId] || [] })
        .eq('id', productId)
        .then((res: { error: { message: string } | null }) => {
          if (res.error) console.warn('[Packages] chÃ†Â°a ghi Ã„â€˜Ã†Â°Ã¡Â»Â£c cÃ¡Â»â„¢t products:', res.error.message);
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
      // NÃ¡ÂºÂ¿u DB chÃ†Â°a cÃƒÂ³ cÃ¡Â»â„¢t mÃ¡Â»Å¸ rÃ¡Â»â„¢ng (chÃ†Â°a chÃ¡ÂºÂ¡y migration) Ã¢â€ â€™ thÃ¡Â»Â­ lÃ¡ÂºÂ¡i khÃƒÂ´ng kÃƒÂ¨m cÃ¡Â»â„¢t mÃ¡Â»Å¸ rÃ¡Â»â„¢ng
      if (error && productsExtendedReady === true && isMissingColumnError(error)) {
        productsExtendedReady = false;
        ({ error } = await supabase.from('products').insert(baseInsert));
      }
      if (error) throw error;
      // Ã„ÂÃ¡Â»â€œng bÃ¡Â»â„¢ gÃƒÂ³i dÃ¡Â»â€¹ch vÃ¡Â»Â¥ lÃƒÂªn cloud (qua store_settings) cho mÃ¡Â»Âi thiÃ¡ÂºÂ¿t bÃ¡Â»â€¹
      syncProductPackagesToCloud(newId, newProduct.packages || newProduct.plans || []);
      showToast(`Ã„ÂÃƒÂ£ thÃƒÂªm sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m "${newProduct.name}" lÃƒÂªn Cloud thÃƒÂ nh cÃƒÂ´ng!`, 'success');
    } catch (e) {
      console.error('LÃ¡Â»â€”i khi lÃ†Â°u Supabase:', e);
      showToast('LÃ¡Â»â€”i khi lÃ†Â°u lÃƒÂªn Cloud, vui lÃƒÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i', 'error');
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
        // NÃ¡ÂºÂ¿u DB chÃ†Â°a cÃƒÂ³ cÃ¡Â»â„¢t mÃ¡Â»Å¸ rÃ¡Â»â„¢ng (chÃ†Â°a chÃ¡ÂºÂ¡y migration) Ã¢â€ â€™ thÃ¡Â»Â­ lÃ¡ÂºÂ¡i khÃƒÂ´ng kÃƒÂ¨m cÃ¡Â»â„¢t mÃ¡Â»Å¸ rÃ¡Â»â„¢ng
        if (error && productsExtendedReady === true && isMissingColumnError(error)) {
          productsExtendedReady = false;
          ({ error } = await supabase.from('products').update(baseUpdate).eq('id', id));
        }
        if (error) throw error;
        // Ã„ÂÃ¡Â»â€œng bÃ¡Â»â„¢ gÃƒÂ³i dÃ¡Â»â€¹ch vÃ¡Â»Â¥ lÃƒÂªn cloud (qua store_settings) cho mÃ¡Â»Âi thiÃ¡ÂºÂ¿t bÃ¡Â»â€¹
        syncProductPackagesToCloud(id, p.packages || p.plans || []);
        showToast('Ã„ÂÃƒÂ£ lÃ†Â°u thÃƒÂ´ng tin sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m vÃƒÂ  Ã„â€˜Ã¡Â»â€œng bÃ¡Â»â„¢ cÃ†Â¡ sÃ¡Â»Å¸ dÃ¡Â»Â¯ liÃ¡Â»â€¡u Cloud! Ã°Å¸â€â€™ (Ã„ÂÃƒÂ£ khÃƒÂ³a bÃ¡ÂºÂ£o vÃ¡Â»â€¡)', 'success');
      } catch (e) {
        console.error('LÃ¡Â»â€”i Update Supabase:', e);
        showToast('LÃ¡Â»â€”i cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t trÃƒÂªn Cloud', 'error');
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
      showToast(`Ã°Å¸â€â€™ Ã„ÂÃƒÆ’ KHÃƒâ€œA "${targetName}"! SÃ¡ÂºÂ£n phÃ¡ÂºÂ©m nÃƒÂ y sÃ¡ÂºÂ½ khÃƒÂ´ng bÃ¡Â»â€¹ thay Ã„â€˜Ã¡Â»â€¢i khi hÃ¡Â»â€¡ thÃ¡Â»â€˜ng nÃƒÂ¢ng cÃ¡ÂºÂ¥p.`, 'success');
    } else {
      showToast(`Ã°Å¸â€â€œ Ã„ÂÃƒÂ£ MÃ¡Â»Å¾ KHÃƒâ€œA "${targetName}".`, 'info');
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
      // DÃ¡Â»Ân gÃƒÂ³i dÃ¡Â»â€¹ch vÃ¡Â»Â¥ cÃ¡Â»Â§a sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m Ã„â€˜ÃƒÂ£ xÃƒÂ³a khÃ¡Â»Âi store_settings cloud
      syncProductPackagesToCloud(id, []);
      showToast('Ã„ÂÃƒÂ£ xÃƒÂ³a sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m trÃƒÂªn Cloud thÃƒÂ nh cÃƒÂ´ng', 'success'); // Changed to success instead of error style
    } catch (e) {
      console.error('LÃ¡Â»â€”i XÃƒÂ³a Supabase:', e);
      showToast('LÃ¡Â»â€”i khi xÃƒÂ³a trÃƒÂªn Cloud', 'error');
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
    showToast(`Ã„ÂÃƒÂ£ thÃƒÂªm danh mÃ¡Â»Â¥c "${newCat.name}"`, 'success');
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

    showToast('Ã„ÂÃƒÂ£ cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t danh mÃ¡Â»Â¥c', 'success');
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
    showToast(`Ã„ÂÃƒÂ£ xÃƒÂ³a danh mÃ¡Â»Â¥c "${targetCat.name}"`, 'error');
  };

  // Orders CRUD
  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    showToast(`Ã„ÂÃƒÂ£ cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t trÃ¡ÂºÂ¡ng thÃƒÂ¡i Ã„â€˜Ã†Â¡n hÃƒÂ ng sang "${status}"`, 'info');
  };

  // Customer creates order in storefront
  const createOrderLocal = (
    productId: string,
    quantity: number,
    paymentMethod: Order['paymentMethod'],
    selectedPackage?: ProductPackage
  ): boolean => {
    const product = products.find((p) => p.id === productId);
    if (!product) return false;

    if (!isAuthenticated) {
      showToast('Vui lÃƒÂ²ng Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p Ã„â€˜Ã¡Â»Æ’ mua sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m!', 'warning');
      navigateToStorefront('login', typeof window !== 'undefined' ? window.location.pathname : '/products');
      return false;
    }

    const buyer = currentUser;
    const isSeller = buyer.sellerStatus === 'approved';
    const unitPrice = getItemEffectivePrice(product, buyer, selectedPackage);
    const total = unitPrice * quantity;

    if (paymentMethod === 'wallet' && buyer.balance < total) {
      showToast('SÃ¡Â»â€˜ dÃ†Â° vÃƒÂ­ khÃƒÂ´ng Ã„â€˜Ã¡Â»Â§! Vui lÃƒÂ²ng nÃ¡ÂºÂ¡p thÃƒÂªm tiÃ¡Â»Ân.', 'error');
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

    const isAccProduct = isAccountLikeProduct(product);

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
          deliveredText = `Ã°Å¸Å½Â® TÃƒâ‚¬I KHOÃ¡ÂºÂ¢N: ${parts[0] || ''}\nÃ°Å¸â€â€˜ MÃ¡ÂºÂ¬T KHÃ¡ÂºÂ¨U: ${parts[1] || ''}${parts[2] ? `\nÃ°Å¸â€ºÂ¡Ã¯Â¸Â 2FA / GHI CHÃƒÅ¡: ${parts[2]}` : ''}`;
          deliveredKey = `TK: ${parts[0]} | MK: ${parts[1]}`;
        } else {
          deliveredText = firstAcc;
          deliveredKey = firstAcc;
        }
      } else if (product.accountUsername || product.accountPassword) {
        deliveredText = `Ã°Å¸Å½Â® TÃƒâ‚¬I KHOÃ¡ÂºÂ¢N: ${product.accountUsername || ''}\nÃ°Å¸â€â€˜ MÃ¡ÂºÂ¬T KHÃ¡ÂºÂ¨U: ${product.accountPassword || ''}${product.account2FA ? `\nÃ°Å¸â€ºÂ¡Ã¯Â¸Â 2FA / GHI CHÃƒÅ¡: ${product.account2FA}` : ''}`;
        deliveredKey = `TK: ${product.accountUsername} | MK: ${product.accountPassword}`;
      } else {
        deliveredText = product.downloadLinkOrKeys || 'HÃ¡Â»â€¡ thÃ¡Â»â€˜ng Ã„â€˜ÃƒÂ£ ghi nhÃ¡ÂºÂ­n Ã„â€˜Ã†Â¡n hÃƒÂ ng tÃƒÂ i khoÃ¡ÂºÂ£n cÃ¡Â»Â§a bÃ¡ÂºÂ¡n.';
        deliveredKey = product.downloadLinkOrKeys || 'ACC-DELIVERED';
      }
    } else {
      deliveredText =
        selectedPackage?.keys ||
        selectedPackage?.downloadUrl ||
        product.downloadLinkOrKeys ||
        'HÃ¡Â»â€¡ thÃ¡Â»â€˜ng Ã„â€˜ÃƒÂ£ gÃ¡Â»Â­i link kÃƒÂ­ch hoÃ¡ÂºÂ¡t Ã„â€˜Ã¡ÂºÂ¿n email cÃ¡Â»Â§a bÃ¡ÂºÂ¡n.';
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

    // Financial Transaction log
    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      txCode: '#GD-' + Math.floor(10000 + Math.random() * 90000),
      type: 'purchase',
      userId: buyer.id,
      userName: buyer.username,
      description: `Thanh toÃƒÂ¡n mua ${product.name}${selectedPackage ? ` [${selectedPackage.name}]` : ''} (x${quantity})`,
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
        title: `Ã„ÂÃ†Â¡n hÃƒÂ ng mÃ¡Â»â€ºi ${newOrderCode}`,
        description: `${buyer.username} vÃ¡Â»Â«a mua ${product.name} (${total.toLocaleString('vi-VN')}Ã„â€˜)`,
        time: 'VÃ¡Â»Â«a xong',
        read: false,
        type: 'order',
      },
      ...prev,
    ]);

    showToast(`Ã„ÂÃƒÂ£ thÃƒÂªm "${product.name}${selectedPackage ? ` [${selectedPackage.name}]` : ''}" vÃƒÂ o giÃ¡Â»Â hÃƒÂ ng!`, 'success');
    return true;
  };

  // ===== MUA HÃƒâ‚¬NG SERVER-SIDE (MÃ¡Â»â€˜c B): Ã†Â°u tiÃƒÂªn RPC create_order trÃƒÂªn DB =====
  // Server tÃ¡Â»Â± kiÃ¡Â»Æ’m giÃƒÂ¡ (tÃ¡Â»Â« DB), stock, sÃ¡Â»â€˜ dÃ†Â°; trÃ¡Â»Â« vÃƒÂ­; giao key/acc; ghi Ã„â€˜Ã†Â¡n +
  // audit trong 1 transaction. NÃ¡ÂºÂ¿u RPC chÃ†Â°a Ã„â€˜Ã†Â°Ã¡Â»Â£c ÃƒÂ¡p (chÃ†Â°a chÃ¡ÂºÂ¡y moc_b_core.sql)
  // Ã¢â€ â€™ tÃ¡Â»Â± fallback vÃ¡Â»Â luÃ¡Â»â€œng local cÃ…Â©, web vÃ¡ÂºÂ«n sÃ¡Â»â€˜ng.
  const createOrder = async (
    productId: string,
    quantity: number,
    paymentMethod: Order['paymentMethod'],
    selectedPackage?: ProductPackage
  ): Promise<boolean> => {
    if (!isAuthenticated) {
      showToast('Vui lÃƒÂ²ng Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p Ã„â€˜Ã¡Â»Æ’ mua sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m!', 'warning');
      navigateToStorefront('login', typeof window !== 'undefined' ? window.location.pathname : '/products');
      return false;
    }
    if (settings.maintenanceMode) {
      showToast('HÃ¡Â»â€¡ thÃ¡Â»â€˜ng Ã„â€˜ang bÃ¡ÂºÂ£o trÃƒÂ¬ tÃ¡ÂºÂ¡m thÃ¡Â»Âi, vui lÃƒÂ²ng quay lÃ¡ÂºÂ¡i sau!', 'warning');
      return false;
    }

    type CreateOrderResult = { status?: string; code?: string; order?: Record<string, unknown>; duplicate?: boolean } | null;
    let result: CreateOrderResult = null;
    try {
      const { data, error } = await supabase.rpc('create_order', {
        p_product_id: productId,
        p_package_id: selectedPackage?.id ?? null,
        p_quantity: quantity,
        p_idem_key: `ui-${productId}-${selectedPackage?.id ?? 'base'}-${Date.now()}`,
      });
      if (error) throw error;
      result = (data as CreateOrderResult) ?? null;
    } catch (e) {
      const msg = String((e as { message?: string })?.message || '');
      if (/Could not find|does not exist|PGRST202|404/i.test(msg)) {
        // RPC chÃ†Â°a cÃƒÂ³ trÃƒÂªn DB (chÃ†Â°a chÃ¡ÂºÂ¡y moc_b_core.sql) Ã¢â€ â€™ dÃƒÂ¹ng luÃ¡Â»â€œng local cÃ…Â©
        return createOrderLocal(productId, quantity, paymentMethod, selectedPackage);
      }
      showToast('LÃ¡Â»â€”i hÃ¡Â»â€¡ thÃ¡Â»â€˜ng khi tÃ¡ÂºÂ¡o Ã„â€˜Ã†Â¡n, vui lÃƒÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i!', 'error');
      return false;
    }

    if (!result || result.status !== 'success' || !result.order) {
      const code = result?.code || 'UNKNOWN';
      // PACKAGE_NOT_FOUND: DB chÃ†Â°a cÃƒÂ³ packages (chÃ†Â°a migration cÃ¡Â»â„¢t packages)
      // Ã¢â€ â€™ fallback vÃ¡Â»Â luÃ¡Â»â€œng local Ã„â€˜Ã¡Â»Æ’ vÃ¡ÂºÂ«n mua Ã„â€˜Ã†Â°Ã¡Â»Â£c bÃƒÂ¬nh thÃ†Â°Ã¡Â»Âng
      if (code === 'PACKAGE_NOT_FOUND') {
        console.warn('[createOrder] Server trÃ¡ÂºÂ£ PACKAGE_NOT_FOUND Ã¢â‚¬â€ fallback local order flow');
        return createOrderLocal(productId, quantity, paymentMethod, selectedPackage);
      }
      const map: Record<string, string> = {
        INSUFFICIENT_BALANCE: 'SÃ¡Â»â€˜ dÃ†Â° vÃƒÂ­ khÃƒÂ´ng Ã„â€˜Ã¡Â»Â§! Vui lÃƒÂ²ng nÃ¡ÂºÂ¡p thÃƒÂªm tiÃ¡Â»Ân.',
        OUT_OF_STOCK: 'SÃ¡ÂºÂ£n phÃ¡ÂºÂ©m Ã„â€˜ÃƒÂ£ hÃ¡ÂºÂ¿t hÃƒÂ ng!',
        PRODUCT_NOT_FOUND: 'SÃ¡ÂºÂ£n phÃ¡ÂºÂ©m khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i!',
        PRODUCT_NOT_ACTIVE: 'SÃ¡ÂºÂ£n phÃ¡ÂºÂ©m hiÃ¡Â»â€¡n khÃƒÂ´ng bÃƒÂ¡n!',
        USER_BANNED: 'TÃƒÂ i khoÃ¡ÂºÂ£n cÃ¡Â»Â§a bÃ¡ÂºÂ¡n Ã„â€˜ÃƒÂ£ bÃ¡Â»â€¹ khÃƒÂ³a!',
        INVALID_QUANTITY: 'SÃ¡Â»â€˜ lÃ†Â°Ã¡Â»Â£ng khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡!',
      };
      showToast(map[code] || 'KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ¡o Ã„â€˜Ã†Â¡n hÃƒÂ ng lÃƒÂºc nÃƒÂ y!', 'error');
      if (code === 'INSUFFICIENT_BALANCE') navigateToStorefront('account-wallet-deposit');
      return false;
    }

    // ThÃƒÂ nh cÃƒÂ´ng trÃƒÂªn SERVER Ã¢â‚¬â€ cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t UI theo nguÃ¡Â»â€œn thÃ¡ÂºÂ­t
    const o = result.order;
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

    // LÃƒÂ m mÃ¡Â»â€ºi sÃ¡Â»â€˜ dÃ†Â° THÃ¡ÂºÂ¬T tÃ¡Â»Â« profiles (server Ã„â€˜ÃƒÂ£ trÃ¡Â»Â«)
    try {
      const { data: prof } = await supabase.from('profiles').select('balance, total_spent').eq('id', buyer.id).maybeSingle();
      if (prof) {
        setUsers((prev) => prev.map((u) => (u.id === buyer.id
          ? { ...u, balance: Number(prof.balance) || 0, totalSpent: Number(prof.total_spent) || u.totalSpent, totalOrders: (u.totalOrders || 0) + 1 }
          : u)));
      }
    } catch {}

    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      txCode: '#GD-' + Math.floor(10000 + Math.random() * 90000),
      type: 'purchase',
      userId: buyer.id,
      userName: buyer.username,
      description: `Thanh toÃƒÂ¡n mua ${newOrder.productName}${newOrder.packageName ? ` [${newOrder.packageName}]` : ''} (x${newOrder.quantity})`,
      amount: -total,
      balanceAfter: currentUser.balance - total,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
    };
    setTransactions((prev) => [newTx, ...prev]);
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: `Ã„ÂÃ†Â¡n hÃƒÂ ng mÃ¡Â»â€ºi ${newOrder.orderCode}`,
        description: `${buyer.username} vÃ¡Â»Â«a mua ${newOrder.productName} (${total.toLocaleString('vi-VN')}Ã„â€˜)`,
        time: 'VÃ¡Â»Â«a xong',
        read: false,
        type: 'order',
      },
      ...prev,
    ]);
    showToast(`Ã°Å¸Å½â€° Mua hÃƒÂ ng thÃƒÂ nh cÃƒÂ´ng! Ã„ÂÃ†Â¡n ${newOrder.orderCode} Ã¢â‚¬â€ xem key trong Ã„ÂÃ†Â¡n HÃƒÂ ng!`, 'success');
    return true;
  };

  // Topup review actions with double-action prevention
  const approveTopup = async (id: string) => {
    const topup = topups.find((t) => t.id === id);
    if (!topup || topup.status !== 'pending') {
      showToast('YÃƒÂªu cÃ¡ÂºÂ§u nÃ¡ÂºÂ¡p nÃƒÂ y Ã„â€˜ÃƒÂ£ Ã„â€˜Ã†Â°Ã¡Â»Â£c xÃ¡Â»Â­ lÃƒÂ½ trÃ†Â°Ã¡Â»â€ºc Ã„â€˜ÃƒÂ³', 'warning');
      return;
    }

    const targetUser = users.find((u) => u.id === topup.userId);
    const newBalance = (targetUser ? targetUser.balance : 0) + topup.amount;

    // 1. CÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t local state ngay lÃ¡ÂºÂ­p tÃ¡Â»Â©c
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

    // 2. Ã„ÂÃ¡Â»â€™NG BÃ¡Â»Ëœ CLOUD: CÃ¡Â»â„¢ng sÃ¡Â»â€˜ dÃ†Â° thÃ¡ÂºÂ­t trÃƒÂªn profiles (Supabase)
    try {
      // ThÃ¡Â»Â­ RPC admin_adjust_balance trÃ†Â°Ã¡Â»â€ºc
      const { data: rpcResult, error: rpcErr } = await supabase.rpc('admin_adjust_balance', {
        p_user_id: topup.userId,
        p_amount: Math.round(topup.amount),
        p_note: `Admin duyÃ¡Â»â€¡t nÃ¡ÂºÂ¡p tiÃ¡Â»Ân ${topup.transferNote || ''}`,
      });
      if (rpcErr) {
        // RPC chÃ†Â°a cÃƒÂ³ Ã¢â€ â€™ fallback update trÃ¡Â»Â±c tiÃ¡ÂºÂ¿p bÃ¡ÂºÂ£ng profiles
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', topup.userId);
        if (updateErr) {
          console.warn('[approveTopup] KhÃƒÂ´ng thÃ¡Â»Æ’ Ã„â€˜Ã¡Â»â€œng bÃ¡Â»â„¢ sÃ¡Â»â€˜ dÃ†Â° lÃƒÂªn Cloud:', updateErr.message);
        }
      } else {
        // RPC thÃƒÂ nh cÃƒÂ´ng Ã¢â€ â€™ lÃ¡ÂºÂ¥y sÃ¡Â»â€˜ dÃ†Â° thÃ¡ÂºÂ­t tÃ¡Â»Â« kÃ¡ÂºÂ¿t quÃ¡ÂºÂ£
        const r = rpcResult as { status?: string; balance?: number } | null;
        if (r?.status === 'success' && r.balance !== undefined) {
          setUsers((prev) =>
            prev.map((u) => (u.id === topup.userId ? { ...u, balance: Number(r.balance) } : u))
          );
        }
      }
      // CÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t topup status trÃƒÂªn cloud
      await supabase
        .from('topups')
        .update({ status: 'approved' })
        .eq('transfer_note', topup.transferNote)
        .eq('user_id', topup.userId);
    } catch (e) {
      console.warn('[approveTopup] Cloud sync failed (non-blocking):', e);
    }

    // 3. Ghi transaction log
    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      txCode: '#GD-' + Math.floor(10000 + Math.random() * 90000),
      type: 'deposit',
      userId: topup.userId,
      userName: topup.userName,
      description: `NÃ¡ÂºÂ¡p tiÃ¡Â»Ân qua ${topup.method} (${topup.transferNote})`,
      amount: topup.amount,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
    };
    setTransactions((prev) => [newTx, ...prev]);

    showToast(
      `Ã„ÂÃƒÂ£ duyÃ¡Â»â€¡t nÃ¡ÂºÂ¡p tiÃ¡Â»Ân ${topup.amount.toLocaleString('vi-VN')}Ã„â€˜ cho ${topup.userName}!`,
      'success'
    );
  };

  const rejectTopup = (id: string, reason: string) => {
    const topup = topups.find((t) => t.id === id);
    if (!topup || topup.status !== 'pending') {
      showToast('YÃƒÂªu cÃ¡ÂºÂ§u nÃ¡ÂºÂ¡p nÃƒÂ y Ã„â€˜ÃƒÂ£ Ã„â€˜Ã†Â°Ã¡Â»Â£c xÃ¡Â»Â­ lÃƒÂ½ trÃ†Â°Ã¡Â»â€ºc Ã„â€˜ÃƒÂ³', 'warning');
      return;
    }

    setTopups((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'rejected',
              rejectReason: reason || 'Giao dÃ¡Â»â€¹ch khÃƒÂ´ng khÃ¡Â»â€ºp sao kÃƒÂª',
              processedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : t
      )
    );
    showToast('ÄÃ£ tá»« chá»‘i yÃªu cáº§u náº¡p tiá»n', 'error');

    // Cáº­p nháº­t cloud
    void supabase
      .from('topups')
      .update({ status: 'rejected' })
      .eq('user_id', topup.userId)
      .eq('transfer_note', topup.transferNote);
  };

  const createTopupRequest = (
    amount: number,
    method: TopupRequest['method'],
    transferNote: string,
    proofImage?: string
  ): string => {
    const buyer = currentUser;
    // Kill switch: chÃ¡ÂºÂ¿ Ã„â€˜Ã¡Â»â„¢ bÃ¡ÂºÂ£o trÃƒÂ¬ Ã¢â€ â€™ khÃƒÂ´ng nhÃ¡ÂºÂ­n nÃ¡ÂºÂ¡p mÃ¡Â»â€ºi
    if (settings.maintenanceMode) {
      showToast('HÃ¡Â»â€¡ thÃ¡Â»â€˜ng Ã„â€˜ang bÃ¡ÂºÂ£o trÃƒÂ¬ tÃ¡ÂºÂ¡m thÃ¡Â»Âi Ã¢â‚¬â€ chÃ†Â°a nhÃ¡ÂºÂ­n yÃƒÂªu cÃ¡ÂºÂ§u nÃ¡ÂºÂ¡p mÃ¡Â»â€ºi!', 'warning');
      return '';
    }
    // Rate limit: tÃ¡Â»â€˜i Ã„â€˜a 5 yÃƒÂªu cÃ¡ÂºÂ§u nÃ¡ÂºÂ¡p Ã„â€˜ang chÃ¡Â»Â / ngÃ†Â°Ã¡Â»Âi dÃƒÂ¹ng (chÃ¡Â»â€˜ng spam)
    const pendingCount = topups.filter((t) => t.userId === buyer.id && t.status === 'pending').length;
    if (pendingCount >= 1) {
      showToast('Báº¡n Ä‘ang cÃ³ 1 yÃªu cáº§u náº¡p chÆ°a hoÃ n táº¥t. Vui lÃ²ng chá» Admin duyá»‡t mÃ£ trÆ°á»›c Ä‘Ã³!', 'error');
      return '';
    }
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
        title: `YÃƒÂªu cÃ¡ÂºÂ§u nÃ¡ÂºÂ¡p tiÃ¡Â»Ân mÃ¡Â»â€ºi ${newTopup.requestCode}`,
        description: `${buyer.username} gÃ¡Â»Â­i yÃƒÂªu cÃ¡ÂºÂ§u nÃ¡ÂºÂ¡p ${amount.toLocaleString('vi-VN')}Ã„â€˜ qua ${method}`,
        time: 'VÃ¡Â»Â«a xong',
        read: false,
        type: 'topup',
      },
      ...prev,
    ]);

    // === Ã„ÂÃ†Â¯Ã¡Â»Å“NG NÃ¡ÂºÂ P THÃ¡ÂºÂ¬T (THUEAPIBANK Ã¢â‚¬â€ MB Bank qua THUEAPI): ghi topup lÃƒÂªn Cloud
    // Ã„â€˜Ã¡Â»Æ’ webhook /api/webhook/mbbank match transfer_note vÃƒÂ  duyÃ¡Â»â€¡t tÃ¡Â»Â± Ã„â€˜Ã¡Â»â„¢ng qua RPC
    // process_bank_webhook. CÃ¡ÂºÂ§n policy "topups_insert_own" trong security_fix_rls.sql;
    // nÃ¡ÂºÂ¿u chÃ†Â°a chÃ¡ÂºÂ¡y SQL thÃƒÂ¬ bÃ¡Â»Â qua im lÃ¡ÂºÂ·ng vÃƒÂ  vÃ¡ÂºÂ«n giÃ¡Â»Â¯ luÃ¡Â»â€œng local nhÃ†Â° cÃ…Â©. ===
    void (async () => {
      try {
        const { data: cloudTopup, error: cloudErr } = await supabase
          .from('topups')
          .insert({
            user_id: buyer.id,
            amount,
            status: 'pending',
            method,
            transfer_note: newTopup.transferNote,
          })
          .select('id')
          .single();

        if (cloudErr || !cloudTopup) {
          console.warn('[Topup] ChÃ†Â°a Ã„â€˜Ã¡Â»â€œng bÃ¡Â»â„¢ Cloud (chÃ¡ÂºÂ¡y security_fix_rls.sql Ã„â€˜Ã¡Â»Æ’ bÃ¡ÂºÂ­t):', cloudErr?.message || 'no row');
          return;
        }
        // Polling trÃ¡ÂºÂ¡ng thÃƒÂ¡i: khi webhook duyÃ¡Â»â€¡t THÃ¡ÂºÂ¬T trÃƒÂªn DB Ã¢â€ â€™ cÃ¡Â»â„¢ng sÃ¡Â»â€˜ dÃ†Â° theo nguÃ¡Â»â€œn thÃ¡ÂºÂ­t
        const pollId = cloudTopup.id;
        let tries = 0;
        const timer = setInterval(async () => {
          tries++;
          try {
            const { data: t } = await supabase.from('topups').select('status').eq('id', pollId).maybeSingle();
            if (t?.status === 'approved') {
              clearInterval(timer);
              // LÃ¡ÂºÂ¥y sÃ¡Â»â€˜ dÃ†Â° thÃ¡ÂºÂ­t tÃ¡Â»Â« profiles (webhook RPC Ã„â€˜ÃƒÂ£ cÃ¡Â»â„¢ng trÃƒÂªn DB)
              const { data: prof } = await supabase.from('profiles').select('balance').eq('id', buyer.id).maybeSingle();
              if (prof) {
                setUsers((prev) => prev.map((u) => (u.id === buyer.id ? { ...u, balance: Number(prof.balance) || 0 } : u)));
              }
              setTopups((prev) =>
                prev.map((tp) =>
                  tp.id === newTopup.id
                    ? { ...tp, status: 'approved', processedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) }
                    : tp
                )
              );
              showToast(`Ã°Å¸Å½â€° Webhook ngÃƒÂ¢n hÃƒÂ ng xÃƒÂ¡c nhÃ¡ÂºÂ­n: +${amount.toLocaleString('vi-VN')}Ã„â€˜ vÃƒÂ o vÃƒÂ­!`, 'success');
            }
          } catch {}
          if (tries >= 30) clearInterval(timer); // dÃ¡Â»Â«ng sau ~5 phÃƒÂºt
        }, 10000);
      } catch {}
    })();

    // Ã¢Å¡Â Ã¯Â¸Â KHÃƒâ€NG cÃƒÂ²n "auto credit simulator" phÃƒÂ­a client Ã¢â‚¬â€ tiÃ¡Â»Ân chÃ¡Â»â€° Ã„â€˜Ã†Â°Ã¡Â»Â£c cÃ¡Â»â„¢ng khi
    // webhook/cron THUEAPIBANK xÃƒÂ¡c nhÃ¡ÂºÂ­n giao dÃ¡Â»â€¹ch THÃ¡ÂºÂ¬T trÃƒÂªn server (RPC cÃ¡Â»â„¢ng
    // vÃƒÂ­ + ghi ledger trong 1 DB transaction). Polling phÃƒÂ­a trÃƒÂªn sÃ¡ÂºÂ½ tÃ¡Â»Â± cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t
    // sÃ¡Â»â€˜ dÃ†Â° hiÃ¡Â»Æ’n thÃ¡Â»â€¹ theo nguÃ¡Â»â€œn thÃ¡ÂºÂ­t khi topup Ã„â€˜Ã†Â°Ã¡Â»Â£c duyÃ¡Â»â€¡t.
    showToast(
      `Ã„ÂÃƒÂ£ tÃ¡ÂºÂ¡o yÃƒÂªu cÃ¡ÂºÂ§u nÃ¡ÂºÂ¡p ${amount.toLocaleString('vi-VN')}Ã„â€˜ (${newTopup.transferNote}). ChuyÃ¡Â»Æ’n khoÃ¡ÂºÂ£n Ã„â€˜ÃƒÂºng nÃ¡Â»â„¢i dung Ã¢â‚¬â€ hÃ¡Â»â€¡ thÃ¡Â»â€˜ng tÃ¡Â»Â± Ã„â€˜Ã¡Â»â„¢ng cÃ¡Â»â„¢ng vÃƒÂ­ khi ngÃƒÂ¢n hÃƒÂ ng xÃƒÂ¡c nhÃ¡ÂºÂ­n.`,
      'info'
    );
    return generatedCode;
  };

  // Card Recharge (NÃ¡ÂºÂ¡p thÃ¡ÂºÂ» cÃƒÂ o) Actions
  const createCardRecharge = (
    network: CardNetwork,
    declaredAmount: number,
    serial: string,
    pin: string
  ): { success: boolean; message: string } => {
    if (!isAuthenticated) {
      return { success: false, message: 'Vui lÃƒÂ²ng Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p tÃƒÂ i khoÃ¡ÂºÂ£n trÃ†Â°Ã¡Â»â€ºc khi nÃ¡ÂºÂ¡p thÃ¡ÂºÂ»!' };
    }

    if (!serial.trim() || !pin.trim()) {
      return { success: false, message: 'Vui lÃƒÂ²ng nhÃ¡ÂºÂ­p Ã„â€˜Ã¡ÂºÂ§y Ã„â€˜Ã¡Â»Â§ sÃ¡Â»â€˜ Serial vÃƒÂ  MÃƒÂ£ thÃ¡ÂºÂ» (PIN)!' };
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
        title: `NÃ¡ÂºÂ¡p thÃ¡ÂºÂ» cÃƒÂ o mÃ¡Â»â€ºi ${cardCode}`,
        description: `${currentUser.username} nÃ¡ÂºÂ¡p thÃ¡ÂºÂ» ${network} ${declaredAmount.toLocaleString('vi-VN')}Ã„â€˜ (ThÃ¡Â»Â±c nhÃ¡ÂºÂ­n: ${receivedAmount.toLocaleString('vi-VN')}Ã„â€˜)`,
        time: 'VÃ¡Â»Â«a xong',
        read: false,
        type: 'card',
      },
      ...prev,
    ]);

    showToast(`Ã„ÂÃƒÂ£ gÃ¡Â»Â­i thÃ¡ÂºÂ» cÃƒÂ o ${network} ${declaredAmount.toLocaleString('vi-VN')}Ã„â€˜ lÃƒÂªn hÃ¡Â»â€¡ thÃ¡Â»â€˜ng xÃ¡Â»Â­ lÃƒÂ½!`, 'success');
    return { success: true, message: `ThÃ¡ÂºÂ» cÃƒÂ o ${cardCode} Ã„â€˜ÃƒÂ£ Ã„â€˜Ã†Â°Ã¡Â»Â£c ghi nhÃ¡ÂºÂ­n vÃƒÂ  Ã„â€˜ang Ã„â€˜Ã†Â°Ã¡Â»Â£c kiÃ¡Â»Æ’m tra.` };
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
      description: `NÃ¡ÂºÂ¡p thÃ¡ÂºÂ» cÃƒÂ o ${card.network} ${card.declaredAmount.toLocaleString('vi-VN')}Ã„â€˜ thÃƒÂ nh cÃƒÂ´ng (+${card.receivedAmount.toLocaleString('vi-VN')}Ã„â€˜ vÃƒÂ o vÃƒÂ­)`,
      amount: card.receivedAmount,
      balanceAfter: newBalance,
      createdAt: nowStr,
      status: 'completed',
    };
    setTransactions((prev) => [newTx, ...prev]);

    showToast(`Ã„ÂÃƒÂ£ duyÃ¡Â»â€¡t thÃ¡ÂºÂ» cÃƒÂ o ${card.code} vÃƒÂ  cÃ¡Â»â„¢ng ${card.receivedAmount.toLocaleString('vi-VN')}Ã„â€˜ vÃƒÂ o vÃƒÂ­ khÃƒÂ¡ch hÃƒÂ ng ${card.userName}!`, 'success');
  };

  const rejectCardRecharge = (id: string, reason: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setCardRecharges((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: 'invalid', processedAt: nowStr, note: reason } : c
      )
    );
    showToast('Ã„ÂÃƒÂ£ tÃ¡Â»Â« chÃ¡Â»â€˜i thÃ¡ÂºÂ» cÃƒÂ o khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡', 'info');
  };

  // Seller Program Actions
  const applySeller = (note?: string): { success: boolean; message: string } => {
    if (!isAuthenticated) {
      return { success: false, message: 'Vui lÃƒÂ²ng Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p Ã„â€˜Ã¡Â»Æ’ Ã„â€˜Ã„Æ’ng kÃƒÂ½ trÃ¡Â»Å¸ thÃƒÂ nh Ã„ÂÃ¡ÂºÂ¡i LÃƒÂ½ / Seller!' };
    }

    if (currentUser.sellerStatus === 'approved') {
      return { success: false, message: 'BÃ¡ÂºÂ¡n Ã„â€˜ÃƒÂ£ lÃƒÂ  Ã„ÂÃ¡ÂºÂ¡i LÃƒÂ½ / Seller cÃ¡Â»Â§a Thanox!' };
    }

    if (currentUser.sellerStatus === 'pending') {
      return { success: false, message: 'YÃƒÂªu cÃ¡ÂºÂ§u Ã„â€˜Ã„Æ’ng kÃƒÂ½ Ã„ÂÃ¡ÂºÂ¡i LÃƒÂ½ cÃ¡Â»Â§a bÃ¡ÂºÂ¡n Ã„â€˜ang chÃ¡Â»Â Admin phÃƒÂª duyÃ¡Â»â€¡t!' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              sellerStatus: 'pending',
              sellerNote: note || 'Ã„ÂÃ„Æ’ng kÃƒÂ½ chÃ†Â°Ã†Â¡ng trÃƒÂ¬nh Ã„ÂÃ¡ÂºÂ¡i LÃƒÂ½ Thanox',
              sellerAppliedAt: nowStr,
            }
          : u
      )
    );

    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: 'Ã„ÂÃ„Æ’ng kÃƒÂ½ Ã„ÂÃ¡ÂºÂ¡i LÃƒÂ½ / Seller mÃ¡Â»â€ºi',
        description: `ThÃƒÂ nh viÃƒÂªn ${currentUser.username} vÃ¡Â»Â«a Ã„â€˜Ã„Æ’ng kÃƒÂ½ trÃ¡Â»Å¸ thÃƒÂ nh Ã„ÂÃ¡ÂºÂ¡i LÃƒÂ½ / CTV`,
        time: 'VÃ¡Â»Â«a xong',
        read: false,
        type: 'seller',
      },
      ...prev,
    ]);

    showToast('Ã„ÂÃƒÂ£ gÃ¡Â»Â­i yÃƒÂªu cÃ¡ÂºÂ§u Ã„â€˜Ã„Æ’ng kÃƒÂ½ Ã„ÂÃ¡ÂºÂ¡i LÃƒÂ½! Admin sÃ¡ÂºÂ½ duyÃ¡Â»â€¡t tÃƒÂ i khoÃ¡ÂºÂ£n cÃ¡Â»Â§a bÃ¡ÂºÂ¡n sÃ¡Â»â€ºm nhÃ¡ÂºÂ¥t.', 'success');
    return { success: true, message: 'Ã„ÂÃ„Æ’ng kÃƒÂ½ thÃƒÂ nh cÃƒÂ´ng, vui lÃƒÂ²ng chÃ¡Â»Â duyÃ¡Â»â€¡t!' };
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
    showToast(`Ã„ÂÃƒÂ£ cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t trÃ¡ÂºÂ¡ng thÃƒÂ¡i Ã„ÂÃ¡ÂºÂ¡i LÃƒÂ½ cÃ¡Â»Â§a tÃƒÂ i khoÃ¡ÂºÂ£n sang "${status}"`, 'info');
  };

  // Auth Operations
  const login = async (identifier: string, password: string, _rememberMe = true): Promise<{ success: boolean; message?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) return { success: false, message: 'Vui lÃƒÂ²ng nhÃ¡ÂºÂ­p tÃƒÂªn Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p hoÃ¡ÂºÂ·c email' };

    // === CHÃ¡Â»ÂNG DÃƒâ€™ MÃ¡ÂºÂ¬T KHÃ¡ÂºÂ¨U (brute force): 5 lÃ¡ÂºÂ§n sai liÃƒÂªn tiÃ¡ÂºÂ¿p => khÃƒÂ³a 5 phÃƒÂºt ===
    try {
      const raw = localStorage.getItem('thanox_login_guard');
      if (raw) {
        const guard = JSON.parse(raw) as { fails: number; lockedUntil?: number };
        if (guard.lockedUntil && Date.now() < guard.lockedUntil) {
          const secs = Math.ceil((guard.lockedUntil - Date.now()) / 1000);
          return { success: false, message: `BÃ¡ÂºÂ¡n Ã„â€˜ÃƒÂ£ nhÃ¡ÂºÂ­p sai quÃƒÂ¡ nhiÃ¡Â»Âu lÃ¡ÂºÂ§n. Vui lÃƒÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i sau ${secs} giÃƒÂ¢y.` };
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
          return { success: false, message: g.lockedUntil ? 'BÃ¡ÂºÂ¡n Ã„â€˜ÃƒÂ£ nhÃ¡ÂºÂ­p sai quÃƒÂ¡ nhiÃ¡Â»Âu lÃ¡ÂºÂ§n. Vui lÃƒÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i sau 5 phÃƒÂºt.' : `Sai tÃƒÂ i khoÃ¡ÂºÂ£n hoÃ¡ÂºÂ·c mÃ¡ÂºÂ­t khÃ¡ÂºÂ©u. (CÃƒÂ²n ${5 - g.fails} lÃ¡ÂºÂ§n thÃ¡Â»Â­)` };
        }
      }
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });
      if (authError || !authData.user) {
        const g = recordLoginFail();
        if (g.lockedUntil) {
          return { success: false, message: 'BÃ¡ÂºÂ¡n Ã„â€˜ÃƒÂ£ nhÃ¡ÂºÂ­p sai quÃƒÂ¡ nhiÃ¡Â»Âu lÃ¡ÂºÂ§n. TÃƒÂ i khoÃ¡ÂºÂ£n bÃ¡Â»â€¹ khÃƒÂ³a tÃ¡ÂºÂ¡m 5 phÃƒÂºt.' };
        }
        // Give users an actionable message for unconfirmed emails instead of a generic one
        if (authError?.message?.toLowerCase().includes('email not confirmed')) {
          return { success: false, message: 'TÃƒÂ i khoÃ¡ÂºÂ£n chÃ†Â°a xÃƒÂ¡c nhÃ¡ÂºÂ­n email. Vui lÃƒÂ²ng kiÃ¡Â»Æ’m tra hÃ¡Â»â„¢p thÃ†Â° (cÃ¡ÂºÂ£ mÃ¡Â»Â¥c Spam) vÃƒÂ  bÃ¡ÂºÂ¥m link kÃƒÂ­ch hoÃ¡ÂºÂ¡t.' };
        }
        return { success: false, message: `Sai tÃƒÂ i khoÃ¡ÂºÂ£n hoÃ¡ÂºÂ·c mÃ¡ÂºÂ­t khÃ¡ÂºÂ©u. (CÃƒÂ²n ${5 - g.fails} lÃ¡ÂºÂ§n thÃ¡Â»Â­)` };
      }

      // Ã„ÂÃ„Æ’ng nhÃ¡ÂºÂ­p thÃƒÂ nh cÃƒÂ´ng => xÃƒÂ³a bÃ¡Â»â„¢ Ã„â€˜Ã¡ÂºÂ¿m sai
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
      return { success: false, message: 'LÃ¡Â»â€”i mÃƒÂ¡y chÃ¡Â»Â§, vui lÃƒÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i.' };
    }
  };

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) return { success: false, message: 'TÃƒÂªn Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p phÃ¡ÂºÂ£i cÃƒÂ³ ÃƒÂ­t nhÃ¡ÂºÂ¥t 3 kÃƒÂ½ tÃ¡Â»Â±.' };
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) return { success: false, message: 'TÃƒÂªn Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p chÃ¡Â»â€° bao gÃ¡Â»â€œm chÃ¡Â»Â¯ cÃƒÂ¡i, sÃ¡Â»â€˜ vÃƒÂ  dÃ¡ÂºÂ¥u gÃ¡ÂºÂ¡ch dÃ†Â°Ã¡Â»â€ºi (_).' };
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) return { success: false, message: 'Ã„ÂÃ¡Â»â€¹a chÃ¡Â»â€° email khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡.' };
    if (!password || password.length < 6) return { success: false, message: 'MÃ¡ÂºÂ­t khÃ¡ÂºÂ©u phÃ¡ÂºÂ£i cÃƒÂ³ ÃƒÂ­t nhÃ¡ÂºÂ¥t 6 kÃƒÂ½ tÃ¡Â»Â±.' };
    try {
      const { data: existingUser } = await supabase.from('profiles').select('username').eq('username', cleanUsername).single();
      if (existingUser) return { success: false, message: 'TÃƒÂªn Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p Ã„â€˜ÃƒÂ£ Ã„â€˜Ã†Â°Ã¡Â»Â£c sÃ¡Â»Â­ dÃ¡Â»Â¥ng.' };
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: { data: { username: cleanUsername } }
      });
      if (authError) {
        let msg = 'Ã„ÂÃ„Æ’ng kÃƒÂ½ khÃƒÂ´ng thÃƒÂ nh cÃƒÂ´ng.';
        const m = authError.message.toLowerCase();
        if (m.includes('already registered') || m.includes('already been registered')) {
          msg = 'Email nÃƒÂ y Ã„â€˜ÃƒÂ£ Ã„â€˜Ã†Â°Ã¡Â»Â£c sÃ¡Â»Â­ dÃ¡Â»Â¥ng.';
        } else if (m.includes('rate limit')) {
          msg = 'BÃ¡ÂºÂ¡n Ã„â€˜ÃƒÂ£ Ã„â€˜Ã„Æ’ng kÃƒÂ½ quÃƒÂ¡ nhiÃ¡Â»Âu lÃ¡ÂºÂ§n. Vui lÃƒÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i sau ÃƒÂ­t phÃƒÂºt.';
        }
        return { success: false, message: msg };
      }
      // ThÃƒÂªm user mÃ¡Â»â€ºi vÃƒÂ o local state ngay lÃ¡ÂºÂ­p tÃ¡Â»Â©c Ã„â€˜Ã¡Â»Æ’ hiÃ¡Â»Æ’n thÃ¡Â»â€¹ trong admin panel
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
      showToast('Ã„ÂÃ„Æ’ng kÃƒÂ½ tÃƒÂ i khoÃ¡ÂºÂ£n thÃƒÂ nh cÃƒÂ´ng! Vui lÃƒÂ²ng kiÃ¡Â»Æ’m tra email Ã„â€˜Ã¡Â»Æ’ kÃƒÂ­ch hoÃ¡ÂºÂ¡t tÃƒÂ i khoÃ¡ÂºÂ£n trÃ†Â°Ã¡Â»â€ºc khi Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p.', 'success');
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Ã„ÂÃƒÂ£ xÃ¡ÂºÂ£y ra lÃ¡Â»â€”i kÃ¡ÂºÂ¿t nÃ¡Â»â€˜i. Vui lÃƒÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i sau.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUserId(null);
    showToast('Ã„ÂÃƒÂ£ Ã„â€˜Ã„Æ’ng xuÃ¡ÂºÂ¥t khÃ¡Â»Âi hÃ¡Â»â€¡ thÃ¡Â»â€˜ng', 'info');
  };

  // Forgot Password: Email normalization & OTP generation
  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message?: string; otp?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, message: 'LÃ¡Â»â€”i khi gÃ¡Â»Â­i email xÃƒÂ¡c thÃ¡Â»Â±c.' };
      return { success: true, message: 'Ã„ÂÃƒÂ£ gÃ¡Â»Â­i email khÃƒÂ´i phÃ¡Â»Â¥c mÃ¡ÂºÂ­t khÃ¡ÂºÂ©u.' };
    } catch (err) {
      return { success: false, message: 'LÃ¡Â»â€”i mÃƒÂ¡y chÃ¡Â»Â§.' };
    }
  };

  const resetPassword = async (email: string, otpOrToken: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otpOrToken, type: 'recovery' });
      if (error) return { success: false, message: 'MÃƒÂ£ xÃƒÂ¡c thÃ¡Â»Â±c khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡.' };
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) return { success: false, message: 'KhÃƒÂ´ng thÃ¡Â»Æ’ cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t mÃ¡ÂºÂ­t khÃ¡ÂºÂ©u.' };
      return { success: true };
    } catch (err) {
      return { success: false, message: 'LÃ¡Â»â€”i mÃƒÂ¡y chÃ¡Â»Â§.' };
    }
  };

  // Admin Direct Password Reset for Customer Assistance
  const adminResetPassword = async (userId: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    if (!newPass || newPass.length < 6) {
      return { success: false, message: 'MÃ¡ÂºÂ­t khÃ¡ÂºÂ©u mÃ¡Â»â€ºi phÃ¡ÂºÂ£i cÃƒÂ³ ÃƒÂ­t nhÃ¡ÂºÂ¥t 6 kÃƒÂ½ tÃ¡Â»Â±!' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPass } : u))
    );

    showToast('Ã„ÂÃƒÂ£ Ã„â€˜Ã¡ÂºÂ·t lÃ¡ÂºÂ¡i mÃ¡ÂºÂ­t khÃ¡ÂºÂ©u mÃ¡Â»â€ºi cho tÃƒÂ i khoÃ¡ÂºÂ£n khÃƒÂ¡ch hÃƒÂ ng thÃƒÂ nh cÃƒÂ´ng!', 'success');
    return { success: true, message: 'MÃ¡ÂºÂ­t khÃ¡ÂºÂ©u Ã„â€˜ÃƒÂ£ Ã„â€˜Ã†Â°Ã¡Â»Â£c cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t.' };
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...updates } : u))
    );
    showToast('Ã„ÂÃƒÂ£ cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t hÃ¡Â»â€œ sÃ†Â¡ cÃƒÂ¡ nhÃƒÂ¢n thÃƒÂ nh cÃƒÂ´ng!', 'success');
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
      showToast('Ã„ÂÃƒÂ£ cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t thÃƒÂ´ng tin ngÃ†Â°Ã¡Â»Âi dÃƒÂ¹ng trÃƒÂªn Cloud', 'success');
    } catch (e) {
      console.error(e);
      showToast('LÃ¡Â»â€”i khi cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t trÃƒÂªn Cloud', 'error');
    }
  };

  const deleteUser = async (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    if (target.role === 'admin' || target.username === 'admin') {
      showToast('KhÃƒÂ´ng thÃ¡Â»Æ’ xÃƒÂ³a tÃƒÂ i khoÃ¡ÂºÂ£n QuÃ¡ÂºÂ£n trÃ¡Â»â€¹ viÃƒÂªn Master (Super Admin)', 'error');
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
      showToast(`Ã„ÂÃƒÂ£ xÃƒÂ³a tÃƒÂ i khoÃ¡ÂºÂ£n ${target.username} trÃƒÂªn Cloud thÃƒÂ nh cÃƒÂ´ng`, 'success');
    } catch (e) {
      console.error(e);
      showToast('LÃ¡Â»â€”i khi xÃƒÂ³a tÃƒÂ i khoÃ¡ÂºÂ£n trÃƒÂªn Cloud', 'error');
    }
  };

  const adjustUserBalance = async (userId: string, amount: number, note: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    // SERVER-SIDE: RPC admin_adjust_balance Ã¢â‚¬â€ cÃ¡Â»â„¢ng Ã„â€˜ÃƒÂºng bÃ¡ÂºÂ£ng profiles (sÃ¡Â»â€˜ dÃ†Â° thÃ¡ÂºÂ­t),
    // khÃƒÂ³a dÃƒÂ²ng, ghi ledger + audit_log. KHÃƒâ€NG sÃ¡Â»Â­a balance trÃ¡Â»Â±c tiÃ¡ÂºÂ¿p Ã¡Â»Å¸ client.
    try {
      const { data, error } = await supabase.rpc('admin_adjust_balance', {
        p_user_id: userId,
        p_amount: Math.round(amount),
        p_note: note || '',
      });
      if (error) throw error;
      const r = data as { status?: string; code?: string; balance?: number } | null;
      if (r?.status !== 'success') {
        showToast(r?.code === 'FORBIDDEN' ? 'BÃ¡ÂºÂ¡n khÃƒÂ´ng cÃƒÂ³ quyÃ¡Â»Ân Ã„â€˜iÃ¡Â»Âu chÃ¡Â»â€°nh sÃ¡Â»â€˜ dÃ†Â°!' : 'KhÃƒÂ´ng thÃ¡Â»Æ’ Ã„â€˜iÃ¡Â»Âu chÃ¡Â»â€°nh sÃ¡Â»â€˜ dÃ†Â° (' + (r?.code || 'lÃ¡Â»â€”i') + ')', 'error');
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
        description: `Ã„ÂiÃ¡Â»Âu chÃ¡Â»â€°nh sÃ¡Â»â€˜ dÃ†Â° bÃ¡Â»Å¸i Admin (${note || 'Thao tÃƒÂ¡c thÃ¡Â»Â§ cÃƒÂ´ng'})`,
        amount,
        balanceAfter: newBalance,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'completed',
      };
      setTransactions((prev) => [newTx, ...prev]);
      showToast(
        `Ã„ÂÃƒÂ£ ${amount >= 0 ? 'cÃ¡Â»â„¢ng' : 'trÃ¡Â»Â«'} ${Math.abs(amount).toLocaleString('vi-VN')}Ã„â€˜ vÃƒÂ o vÃƒÂ­ cÃ¡Â»Â§a ${targetUser.username} (sÃ¡Â»â€˜ dÃ†Â° mÃ¡Â»â€ºi: ${newBalance.toLocaleString('vi-VN')}Ã„â€˜)`,
        'success'
      );
    } catch (e) {
      console.error(e);
      showToast('LÃ¡Â»â€”i Ã„â€˜iÃ¡Â»Âu chÃ¡Â»â€°nh sÃ¡Â»â€˜ dÃ†Â° (server)', 'error');
    }
  };

  // ADMIN HOÃƒâ‚¬N TIÃ¡Â»â‚¬N Ã„ÂÃ†Â N CLOUD Ã¢â‚¬â€ RPC admin_refund_order: cÃ¡Â»â„¢ng lÃ¡ÂºÂ¡i vÃƒÂ­ Ã„â€˜ÃƒÂºng 1 lÃ¡ÂºÂ§n,
  // Ã„â€˜Ã†Â¡n -> refunded, ledger REFUND + audit. KHÃƒâ€NG sÃ¡Â»Â­a lÃ¡Â»â€¹ch sÃ¡Â»Â­ gÃ¡Â»â€˜c.
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
          r?.code === 'ALREADY_REFUNDED' ? 'Ã„ÂÃ†Â¡n nÃƒÂ y Ã„â€˜ÃƒÂ£ Ã„â€˜Ã†Â°Ã¡Â»Â£c hoÃƒÂ n tiÃ¡Â»Ân trÃ†Â°Ã¡Â»â€ºc Ã„â€˜ÃƒÂ³!' :
          r?.code === 'NOT_REFUNDABLE' ? 'ChÃ¡Â»â€° hoÃƒÂ n tiÃ¡Â»Ân Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã†Â¡n Ã„â€˜ÃƒÂ£ hoÃƒÂ n thÃƒÂ nh!' :
          r?.code === 'FORBIDDEN' ? 'BÃ¡ÂºÂ¡n khÃƒÂ´ng cÃƒÂ³ quyÃ¡Â»Ân hoÃƒÂ n tiÃ¡Â»Ân!' : 'KhÃƒÂ´ng thÃ¡Â»Æ’ hoÃƒÂ n tiÃ¡Â»Ân (' + (r?.code || 'lÃ¡Â»â€”i') + ')',
          'error'
        );
        return false;
      }
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'refunded' as const } : o)));
      showToast(`Ã¢Å“â€¦ Ã„ÂÃƒÂ£ hoÃƒÂ n ${(r.refunded ?? 0).toLocaleString('vi-VN')}Ã„â€˜ vÃƒÂ o vÃƒÂ­ khÃƒÂ¡ch (ledger REFUND + audit Ã„â€˜ÃƒÂ£ ghi)`, 'success');
      return true;
    } catch (e) {
      console.error(e);
      showToast('LÃ¡Â»â€”i hoÃƒÂ n tiÃ¡Â»Ân (server)', 'error');
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
      showToast(`Ã„ÂÃƒÂ£ ${newStatus === 'banned' ? 'khÃƒÂ³a' : 'mÃ¡Â»Å¸ khÃƒÂ³a'} tÃƒÂ i khoÃ¡ÂºÂ£n ${user.username} trÃƒÂªn Cloud`, newStatus === 'banned' ? 'error' : 'success');
    } catch (e) {
      console.error(e);
      showToast('LÃ¡Â»â€”i cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t trÃ¡ÂºÂ¡ng thÃƒÂ¡i lÃƒÂªn Cloud', 'error');
    }
  };

  // Support Tickets
  const sendTicketMessage = (ticketId: string, message: string, sender: 'admin' | 'user' = 'admin') => {
    const timeNow = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: 'm-' + Date.now(),
      sender,
      senderName: sender === 'admin' ? 'Thanox Admin' : (currentUser?.username || 'KhÃƒÂ¡ch hÃƒÂ ng'),
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
      showToast('Ã„ÂÃƒÂ£ gÃ¡Â»Â­i phÃ¡ÂºÂ£n hÃ¡Â»â€œi tÃ¡Â»â€ºi khÃƒÂ¡ch hÃƒÂ ng', 'success');
    }
  };

  const updateTicketStatus = (ticketId: string, status: SupportTicket['status']) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
    showToast(`Ã„ÂÃƒÂ£ cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t trÃ¡ÂºÂ¡ng thÃƒÂ¡i ticket sang "${status}"`, 'info');
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
        title: `Ticket mÃ¡Â»â€ºi ${newTicket.ticketNumber}`,
        description: `${buyer.username}: ${subject}`,
        time: 'VÃ¡Â»Â«a xong',
        read: false,
        type: 'ticket',
      },
      ...prev,
    ]);

    showToast(`Ã„ÂÃƒÂ£ gÃ¡Â»Â­i yÃƒÂªu cÃ¡ÂºÂ§u hÃ¡Â»â€” trÃ¡Â»Â£ "${newTicket.ticketNumber}"`, 'success');
    return newTicket.id;
  };

  const createTicket = (subject: string, message: string): string => {
    return createSupportTicket(subject, 'HÃ¡Â»â€” trÃ¡Â»Â£ kÃ¡Â»Â¹ thuÃ¡ÂºÂ­t', message);
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
    showToast('Ã„ÂÃƒÂ£ lÃ†Â°u cÃ¡ÂºÂ¥u hÃƒÂ¬nh hÃ¡Â»â€¡ thÃ¡Â»â€˜ng thÃƒÂ nh cÃƒÂ´ng', 'success');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('Ã„ÂÃƒÂ£ Ã„â€˜ÃƒÂ¡nh dÃ¡ÂºÂ¥u Ã„â€˜Ã¡Â»Âc tÃ¡ÂºÂ¥t cÃ¡ÂºÂ£ thÃƒÂ´ng bÃƒÂ¡o', 'info');
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
    showToast('Ã„ÂÃƒÂ£ Ã„â€˜Ã¡ÂºÂ·t lÃ¡ÂºÂ¡i dÃ¡Â»Â¯ liÃ¡Â»â€¡u mÃ¡ÂºÂ«u (Ã„â€˜ÃƒÂ£ bÃ¡ÂºÂ£o vÃ¡Â»â€¡ cÃƒÂ¡c sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m Ã„â€˜ang KHÃƒâ€œA)!', 'success');
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
    showToast('Ã„ ÃƒÂ£ xÃƒÂ³a trÃ¡ÂºÂ¯ng toÃƒÂ n bÃ¡Â»â„¢ dÃ¡Â»Â¯ liÃ¡Â»â€¡u mÃ¡ÂºÂ«u!', 'warning');
  };

  // Auto expire pending topups older than 5 minutes for current user
  useEffect(() => {
    if (!currentUser) return;
    const timer = setInterval(() => {
      setTopups((prev) => {
        let changed = false;
        const now = Date.now();
        const newTopups = prev.map(t => {
          if (t.userId === currentUser.id && t.status === 'pending') {
             // Parse time. createdAt is like '2026-08-23 15:10'
             const createdTime = new Date(t.createdAt.replace(' ', 'T') + ':00Z').getTime();
             if (now - createdTime > 300000) {
                changed = true;
                void supabase.from('topups').update({ status: 'rejected' }).eq('id', t.id);
                return { ...t, status: 'rejected', rejectReason: 'Háº¿t háº¡n (quÃ¡ 5 phÃºt)' };
             }
          }
          return t;
        });
        return changed ? newTopups : prev;
      });
    }, 60000); // Check every minute
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






