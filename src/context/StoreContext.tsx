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
// null = chÆ°a probe, true = Ä‘Ã£ cháº¡y migration (cá»™t tá»“n táº¡i), false = chÆ°a cÃ³ cá»™t
// ============================================================================
let productsExtendedReady: boolean | null = null;

const isMissingColumnError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  const code = String(e.code || '');
  const msg = String(e.message || '');
  return code === 'PGRST204' || code === '42703' || /does not exist|Could not find the '(packages|product_type|is_sale|sale_price|instructions|accounts_list|images|download_url)'/i.test(msg);
};

// Payload cÃ¡c cá»™t má»Ÿ rá»™ng (chá»‰ gá»­i khi migration Ä‘Ã£ Ä‘Æ°á»£c Ã¡p dá»¥ng)
// Strip key/link bÃ­ máº­t khá»i packages trÆ°á»›c khi lÆ°u lÃªn cloud (cá»™t packages
// public cho UI; key giao hÃ ng chá»‰ náº±m trong hidden_keys_or_links Ä‘Ã£ bá»‹ thu quyá»n)
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
  // Ref giá»¯ productPackages Má»šI NHáº¤T (trÃ¡nh race giá»¯a effect táº£i store_settings
  // vÃ  effect táº£i products â€” báº£n táº£i sau khÃ´ng Ä‘Æ°á»£c Ä‘Ã¨ máº¥t gÃ³i cá»§a báº£n trÆ°á»›c)
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
        // Probe 1 láº§n: kiá»ƒm tra cá»™t má»Ÿ rá»™ng (packages...) Ä‘Ã£ tá»“n táº¡i trÃªn DB chÆ°a
        const { error: probeError } = await supabase.from('products').select('packages').limit(1);
        productsExtendedReady = !probeError;

        // Äá»c qua VIEW cÃ´ng khai (khÃ´ng chá»©a cá»™t key/acc bÃ­ máº­t â€” moc_b_core.sql)
        const { data, error } = await supabase
          .from('products_public')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data && data.length > 0) {
          // Báº£n localStorage (do admin cáº¥u hÃ¬nh) dÃ¹ng Ä‘á»ƒ bá»• sung cÃ¡c trÆ°á»ng
          // mÃ  DB chÆ°a cÃ³ cá»™t (packages, sale, instructions...) â€” trÃ¡nh máº¥t dá»¯ liá»‡u
          // trÃ¬nh duyá»‡t Ä‘ang dÃ¹ng trÆ°á»›c khi migration Ä‘Æ°á»£c cháº¡y.
          const localSnapshot = products;
          // GÃ³i dá»‹ch vá»¥ Ä‘á»“ng bá»™ qua store_settings (cloud, hoáº¡t Ä‘á»™ng cáº£ khi chÆ°a migration)
          // Æ¯u tiÃªn ref (má»›i nháº¥t) rá»“i tá»›i state closure (tá»« localStorage)
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
            // === TrÆ°á»ng má»Ÿ rá»™ng: Æ°u tiÃªn DB, fallback vá» báº£n localStorage ===
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
        console.error('Lá»—i táº£i sáº£n pháº©m tá»« Supabase:', err);
      }
    };
    
    const fetchSupabaseUsers = async () => {
        try {
          // Query 'profiles' table (not 'users') â€” Supabase Auth trigger creates
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
          console.error('Lá»—i táº£i Users tá»« Supabase:', err);
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
              userName: userMap.get(t.user_id) || 'KhÃ¡ch',
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
          console.error('Lá»—i táº£i Topups tá»« Supabase:', e);
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
    username: 'KhÃ¡ch',
    name: 'KhÃ¡ch hÃ ng',
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
      '%cðŸ›‘ Dá»ªNG Láº I! Cáº¢NH BÃO Báº¢O Máº¬T THANOX ðŸ›‘',
      'color: #EF4444; font-size: 22px; font-weight: bold;'
    );
    console.log(
      '%cÄÃ¢y lÃ  tÃ­nh nÄƒng dÃ nh riÃªng cho nhÃ  phÃ¡t triá»ƒn. Tuyá»‡t Ä‘á»‘i KHÃ”NG dÃ¡n báº¥t ká»³ Ä‘oáº¡n mÃ£ script nÃ o vÃ o Ä‘Ã¢y Ä‘á»ƒ trÃ¡nh bá»‹ hacker Ä‘Ã¡nh cáº¯p tÃ i khoáº£n!',
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

  // Má»‘c B: load Ä‘Æ¡n hÃ ng CLOUD cá»§a user (admin xem háº¿t) â€” merge vá»›i local cÅ©
  useEffect(() => {
    if (!currentUserId) return;
    (async () => {
      try {
        const isAdmin = users.find((u) => u.id === currentUserId)?.role === 'admin';
        let q = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(300);
        if (!isAdmin) q = q.eq('user_id', currentUserId);
        const { data, error } = await q;
        if (error || !Array.isArray(data)) return; // báº£ng chÆ°a cÃ³ (chÆ°a cháº¡y SQL) â†’ im láº·ng
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
        // DÃ¹ng RPC get_public_settings (Ä‘Ã£ strip secret nháº¡y cáº£m á»Ÿ DB).
        // RPC chÆ°a tá»“n táº¡i (chÆ°a cháº¡y moc_b_core.sql) â†’ fallback select cÅ©.
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

        // GÃ³i dá»‹ch vá»¥ admin cáº¥u hÃ¬nh (lÆ°u kÃ¨m settings cloud) â€” Ã¡p lÃªn sáº£n pháº©m
        // Ä‘á»ƒ má»i thiáº¿t bá»‹ tháº¥y gÃ³i ngay cáº£ khi chÆ°a cháº¡y migration cá»™t packages.
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
      `ÄÃ£ thÃªm "${product.name}${selectedPackage ? ` [${selectedPackage.name}]` : ''}" vÃ o giá» hÃ ng!`,
      'success'
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('ÄÃ£ xÃ³a sáº£n pháº©m khá»i giá» hÃ ng', 'info');
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

    // Check minimum qualifying order value (default 200.000Ä‘)
    const minOrderVal = settings.affiliateMinimumOrderValue ?? 200000;
    if (orderTotal < minOrderVal) return;

    // Deduplication: An order can ONLY award affiliate commission ONCE
    const alreadyRewarded = affiliateRewards.some(
      (r) => r.orderId === orderId && r.status === 'completed'
    );
    if (alreadyRewarded) return;

    // Determine reward amount (default: 10.000Ä‘, or higher tier if enabled)
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
      console.log(`[Affiliate] Referrer ${referrer.username} reached daily reward cap of ${dailyCap}Ä‘.`);
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
      description: `Hoa há»“ng giá»›i thiá»‡u: ÄÆ¡n ${orderCode} cá»§a ${buyer.username} (+${rewardAmount.toLocaleString('vi-VN')}Ä‘ vÃ o Sá»‘ DÆ° Affiliate)`,
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
        title: `Nháº­n thÆ°á»Ÿng giá»›i thiá»‡u +${rewardAmount.toLocaleString('vi-VN')}Ä‘`,
        description: `Báº¡n vá»«a nháº­n ${rewardAmount.toLocaleString('vi-VN')}Ä‘ hoa há»“ng tá»« Ä‘Æ¡n hÃ ng há»£p lá»‡ cá»§a ${buyer.username} (${orderCode})`,
        time: 'Vá»«a xong',
        read: false,
        type: 'system',
      },
      ...prev,
    ]);
  };

  const checkoutCart = async (paymentMethod: Order['paymentMethod']): Promise<boolean> => {
    if (cart.length === 0) {
      showToast('Giá» hÃ ng cá»§a báº¡n Ä‘ang trá»‘ng!', 'warning');
      return false;
    }

    if (!isAuthenticated) {
      showToast('Vui lÃ²ng Ä‘Äƒng nháº­p tÃ i khoáº£n Ä‘á»ƒ thá»±c hiá»‡n thanh toÃ¡n!', 'warning');
      navigateToStorefront('login', '/cart');
      return false;
    }

    const buyer = currentUser;
    const total = cart.reduce((sum, item) => {
      const price = getItemEffectivePrice(item.product, buyer, item.selectedPackage);
      return sum + price * item.quantity;
    }, 0);

    if (paymentMethod === 'wallet' && buyer.balance < total) {
      showToast(`Sá»‘ dÆ° vÃ­ khÃ´ng Ä‘á»§! Cáº§n thÃªm ${(total - buyer.balance).toLocaleString('vi-VN')} VNÄ`, 'error');
      return false;
    }

    // ===== SERVER-SIDE: tá»«ng item qua RPC create_order (kiá»ƒm giÃ¡/stock/vÃ­ á»Ÿ DB).
    // createOrder tá»± fallback local náº¿u RPC chÆ°a Ã¡p. createOrder tá»± cáº­p nháº­t
    // orders/balance tháº­t/notification/toast cho tá»«ng Ä‘Æ¡n. =====
    let created = 0;
    for (const item of cart) {
      const ok = await createOrder(item.product.id, item.quantity, paymentMethod, item.selectedPackage);
      if (ok) created++;
    }

    if (created === 0) {
      showToast('KhÃ´ng thá»ƒ thanh toÃ¡n Ä‘Æ¡n nÃ o â€” vui lÃ²ng kiá»ƒm tra láº¡i giá» hÃ ng!', 'error');
      return false;
    }

    // Affiliate cho Ä‘Æ¡n Ä‘áº§u tiÃªn cá»§a láº§n checkout nÃ y
    processAffiliateRewardForOrder('ord-' + Date.now(), '#TX-' + Math.floor(10000 + Math.random() * 90000), total, buyer);

    clearCart();
    if (created < cart.length) {
      showToast(`Thanh toÃ¡n thÃ nh cÃ´ng ${created}/${cart.length} sáº£n pháº©m (má»™t sá»‘ sáº£n pháº©m lá»—i/háº¿t hÃ ng)!`, 'warning');
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

  // Äá»“ng bá»™ gÃ³i dá»‹ch vá»¥ cá»§a sáº£n pháº©m lÃªn Cloud qua báº£ng store_settings
  // (hoáº¡t Ä‘á»™ng ngay cáº£ khi chÆ°a cháº¡y migration thÃªm cá»™t packages).
  // packages rá»—ng => xÃ³a key Ä‘á»ƒ má»i thiáº¿t bá»‹ nháº­n biáº¿t gÃ³i Ä‘Ã£ bá»‹ gá»¡.
  const syncProductPackagesToCloud = (productId: string, packages: ProductPackage[]) => {
    setSettings((prev) => {
      const map = { ...(prev.productPackages || {}) };
      const safePkgs = sanitizePackages(packages);
      if (safePkgs.length > 0) {
        map[productId] = safePkgs;
      } else {
        delete map[productId];
      }
      // Cáº­p nháº­t ngay ref Ä‘á»ƒ cÃ¡c láº§n táº£i sau khÃ´ng Ä‘Ã¨ máº¥t gÃ³i vá»«a lÆ°u
      productPackagesRef.current = { ...productPackagesRef.current, ...map };
      // Äá»“ng bá»™ LUÃ”N cá»™t products.packages â€” RPC create_order Ä‘á»c tá»« cá»™t nÃ y
      void supabase
        .from('products')
        .update({ packages: map[productId] || [] })
        .eq('id', productId)
        .then((res: { error: { message: string } | null }) => {
          if (res.error) console.warn('[Packages] chÆ°a ghi Ä‘Æ°á»£c cá»™t products:', res.error.message);
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
      // Náº¿u DB chÆ°a cÃ³ cá»™t má»Ÿ rá»™ng (chÆ°a cháº¡y migration) â†’ thá»­ láº¡i khÃ´ng kÃ¨m cá»™t má»Ÿ rá»™ng
      if (error && productsExtendedReady === true && isMissingColumnError(error)) {
        productsExtendedReady = false;
        ({ error } = await supabase.from('products').insert(baseInsert));
      }
      if (error) throw error;
      // Äá»“ng bá»™ gÃ³i dá»‹ch vá»¥ lÃªn cloud (qua store_settings) cho má»i thiáº¿t bá»‹
      syncProductPackagesToCloud(newId, newProduct.packages || newProduct.plans || []);
      showToast(`ÄÃ£ thÃªm sáº£n pháº©m "${newProduct.name}" lÃªn Cloud thÃ nh cÃ´ng!`, 'success');
    } catch (e) {
      console.error('Lá»—i khi lÆ°u Supabase:', e);
      showToast('Lá»—i khi lÆ°u lÃªn Cloud, vui lÃ²ng thá»­ láº¡i', 'error');
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
        // Náº¿u DB chÆ°a cÃ³ cá»™t má»Ÿ rá»™ng (chÆ°a cháº¡y migration) â†’ thá»­ láº¡i khÃ´ng kÃ¨m cá»™t má»Ÿ rá»™ng
        if (error && productsExtendedReady === true && isMissingColumnError(error)) {
          productsExtendedReady = false;
          ({ error } = await supabase.from('products').update(baseUpdate).eq('id', id));
        }
        if (error) throw error;
        // Äá»“ng bá»™ gÃ³i dá»‹ch vá»¥ lÃªn cloud (qua store_settings) cho má»i thiáº¿t bá»‹
        syncProductPackagesToCloud(id, p.packages || p.plans || []);
        showToast('ÄÃ£ lÆ°u thÃ´ng tin sáº£n pháº©m vÃ  Ä‘á»“ng bá»™ cÆ¡ sá»Ÿ dá»¯ liá»‡u Cloud! ðŸ”’ (ÄÃ£ khÃ³a báº£o vá»‡)', 'success');
      } catch (e) {
        console.error('Lá»—i Update Supabase:', e);
        showToast('Lá»—i cáº­p nháº­t trÃªn Cloud', 'error');
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
      showToast(`ðŸ”’ ÄÃƒ KHÃ“A "${targetName}"! Sáº£n pháº©m nÃ y sáº½ khÃ´ng bá»‹ thay Ä‘á»•i khi há»‡ thá»‘ng nÃ¢ng cáº¥p.`, 'success');
    } else {
      showToast(`ðŸ”“ ÄÃ£ Má»ž KHÃ“A "${targetName}".`, 'info');
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
      // Dá»n gÃ³i dá»‹ch vá»¥ cá»§a sáº£n pháº©m Ä‘Ã£ xÃ³a khá»i store_settings cloud
      syncProductPackagesToCloud(id, []);
      showToast('ÄÃ£ xÃ³a sáº£n pháº©m trÃªn Cloud thÃ nh cÃ´ng', 'success'); // Changed to success instead of error style
    } catch (e) {
      console.error('Lá»—i XÃ³a Supabase:', e);
      showToast('Lá»—i khi xÃ³a trÃªn Cloud', 'error');
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
    showToast(`ÄÃ£ thÃªm danh má»¥c "${newCat.name}"`, 'success');
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

    showToast('ÄÃ£ cáº­p nháº­t danh má»¥c', 'success');
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
    showToast(`ÄÃ£ xÃ³a danh má»¥c "${targetCat.name}"`, 'error');
  };

  // Orders CRUD
  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    showToast(`ÄÃ£ cáº­p nháº­t tráº¡ng thÃ¡i Ä‘Æ¡n hÃ ng sang "${status}"`, 'info');
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
      showToast('Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ mua sáº£n pháº©m!', 'warning');
      navigateToStorefront('login', typeof window !== 'undefined' ? window.location.pathname : '/products');
      return false;
    }

    const buyer = currentUser;
    const isSeller = buyer.sellerStatus === 'approved';
    const unitPrice = getItemEffectivePrice(product, buyer, selectedPackage);
    const total = unitPrice * quantity;

    if (paymentMethod === 'wallet' && buyer.balance < total) {
      showToast('Sá»‘ dÆ° vÃ­ khÃ´ng Ä‘á»§! Vui lÃ²ng náº¡p thÃªm tiá»n.', 'error');
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
          deliveredText = `ðŸŽ® TÃ€I KHOáº¢N: ${parts[0] || ''}\nðŸ”‘ Máº¬T KHáº¨U: ${parts[1] || ''}${parts[2] ? `\nðŸ›¡ï¸ 2FA / GHI CHÃš: ${parts[2]}` : ''}`;
          deliveredKey = `TK: ${parts[0]} | MK: ${parts[1]}`;
        } else {
          deliveredText = firstAcc;
          deliveredKey = firstAcc;
        }
      } else if (product.accountUsername || product.accountPassword) {
        deliveredText = `ðŸŽ® TÃ€I KHOáº¢N: ${product.accountUsername || ''}\nðŸ”‘ Máº¬T KHáº¨U: ${product.accountPassword || ''}${product.account2FA ? `\nðŸ›¡ï¸ 2FA / GHI CHÃš: ${product.account2FA}` : ''}`;
        deliveredKey = `TK: ${product.accountUsername} | MK: ${product.accountPassword}`;
      } else {
        deliveredText = product.downloadLinkOrKeys || 'Há»‡ thá»‘ng Ä‘Ã£ ghi nháº­n Ä‘Æ¡n hÃ ng tÃ i khoáº£n cá»§a báº¡n.';
        deliveredKey = product.downloadLinkOrKeys || 'ACC-DELIVERED';
      }
    } else {
      deliveredText =
        selectedPackage?.keys ||
        selectedPackage?.downloadUrl ||
        product.downloadLinkOrKeys ||
        'Há»‡ thá»‘ng Ä‘Ã£ gá»­i link kÃ­ch hoáº¡t Ä‘áº¿n email cá»§a báº¡n.';
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
      description: `Thanh toÃ¡n mua ${product.name}${selectedPackage ? ` [${selectedPackage.name}]` : ''} (x${quantity})`,
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
        title: `ÄÆ¡n hÃ ng má»›i ${newOrderCode}`,
        description: `${buyer.username} vá»«a mua ${product.name} (${total.toLocaleString('vi-VN')}Ä‘)`,
        time: 'Vá»«a xong',
        read: false,
        type: 'order',
      },
      ...prev,
    ]);

    showToast(`ÄÃ£ thÃªm "${product.name}${selectedPackage ? ` [${selectedPackage.name}]` : ''}" vÃ o giá» hÃ ng!`, 'success');
    return true;
  };

  // ===== MUA HÃ€NG SERVER-SIDE (Má»‘c B): Æ°u tiÃªn RPC create_order trÃªn DB =====
  // Server tá»± kiá»ƒm giÃ¡ (tá»« DB), stock, sá»‘ dÆ°; trá»« vÃ­; giao key/acc; ghi Ä‘Æ¡n +
  // audit trong 1 transaction. Náº¿u RPC chÆ°a Ä‘Æ°á»£c Ã¡p (chÆ°a cháº¡y moc_b_core.sql)
  // â†’ tá»± fallback vá» luá»“ng local cÅ©, web váº«n sá»‘ng.
  const createOrder = async (
    productId: string,
    quantity: number,
    paymentMethod: Order['paymentMethod'],
    selectedPackage?: ProductPackage
  ): Promise<boolean> => {
    if (!isAuthenticated) {
      showToast('Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ mua sáº£n pháº©m!', 'warning');
      navigateToStorefront('login', typeof window !== 'undefined' ? window.location.pathname : '/products');
      return false;
    }
    if (settings.maintenanceMode) {
      showToast('Há»‡ thá»‘ng Ä‘ang báº£o trÃ¬ táº¡m thá»i, vui lÃ²ng quay láº¡i sau!', 'warning');
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
        // RPC chÆ°a cÃ³ trÃªn DB (chÆ°a cháº¡y moc_b_core.sql) â†’ dÃ¹ng luá»“ng local cÅ©
        return createOrderLocal(productId, quantity, paymentMethod, selectedPackage);
      }
      showToast('Lá»—i há»‡ thá»‘ng khi táº¡o Ä‘Æ¡n, vui lÃ²ng thá»­ láº¡i!', 'error');
      return false;
    }

    if (!result || result.status !== 'success' || !result.order) {
      const code = result?.code || 'UNKNOWN';
      // PACKAGE_NOT_FOUND: DB chÆ°a cÃ³ packages (chÆ°a migration cá»™t packages)
      // â†’ fallback vá» luá»“ng local Ä‘á»ƒ váº«n mua Ä‘Æ°á»£c bÃ¬nh thÆ°á»ng
      if (code === 'PACKAGE_NOT_FOUND') {
        console.warn('[createOrder] Server tráº£ PACKAGE_NOT_FOUND â€” fallback local order flow');
        return createOrderLocal(productId, quantity, paymentMethod, selectedPackage);
      }
      const map: Record<string, string> = {
        INSUFFICIENT_BALANCE: 'Sá»‘ dÆ° vÃ­ khÃ´ng Ä‘á»§! Vui lÃ²ng náº¡p thÃªm tiá»n.',
        OUT_OF_STOCK: 'Sáº£n pháº©m Ä‘Ã£ háº¿t hÃ ng!',
        PRODUCT_NOT_FOUND: 'Sáº£n pháº©m khÃ´ng tá»“n táº¡i!',
        PRODUCT_NOT_ACTIVE: 'Sáº£n pháº©m hiá»‡n khÃ´ng bÃ¡n!',
        USER_BANNED: 'TÃ i khoáº£n cá»§a báº¡n Ä‘Ã£ bá»‹ khÃ³a!',
        INVALID_QUANTITY: 'Sá»‘ lÆ°á»£ng khÃ´ng há»£p lá»‡!',
      };
      showToast(map[code] || 'KhÃ´ng thá»ƒ táº¡o Ä‘Æ¡n hÃ ng lÃºc nÃ y!', 'error');
      if (code === 'INSUFFICIENT_BALANCE') navigateToStorefront('account-wallet-deposit');
      return false;
    }

    // ThÃ nh cÃ´ng trÃªn SERVER â€” cáº­p nháº­t UI theo nguá»“n tháº­t
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

    // LÃ m má»›i sá»‘ dÆ° THáº¬T tá»« profiles (server Ä‘Ã£ trá»«)
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
      description: `Thanh toÃ¡n mua ${newOrder.productName}${newOrder.packageName ? ` [${newOrder.packageName}]` : ''} (x${newOrder.quantity})`,
      amount: -total,
      balanceAfter: currentUser.balance - total,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
    };
    setTransactions((prev) => [newTx, ...prev]);
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: `ÄÆ¡n hÃ ng má»›i ${newOrder.orderCode}`,
        description: `${buyer.username} vá»«a mua ${newOrder.productName} (${total.toLocaleString('vi-VN')}Ä‘)`,
        time: 'Vá»«a xong',
        read: false,
        type: 'order',
      },
      ...prev,
    ]);
    showToast(`ðŸŽ‰ Mua hÃ ng thÃ nh cÃ´ng! ÄÆ¡n ${newOrder.orderCode} â€” xem key trong ÄÆ¡n HÃ ng!`, 'success');
    return true;
  };

  // Topup review actions with double-action prevention
  const approveTopup = async (id: string) => {
    const topup = topups.find((t) => t.id === id);
    if (!topup || topup.status !== 'pending') {
      showToast('YÃªu cáº§u náº¡p nÃ y Ä‘Ã£ Ä‘Æ°á»£c xá»­ lÃ½ trÆ°á»›c Ä‘Ã³', 'warning');
      return;
    }

    const targetUser = users.find((u) => u.id === topup.userId);
    const newBalance = (targetUser ? targetUser.balance : 0) + topup.amount;

    // 1. Cáº­p nháº­t local state ngay láº­p tá»©c
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

    // 2. Äá»’NG Bá»˜ CLOUD: Cá»™ng sá»‘ dÆ° tháº­t trÃªn profiles (Supabase)
    try {
      // Thá»­ RPC admin_adjust_balance trÆ°á»›c
      const { data: rpcResult, error: rpcErr } = await supabase.rpc('admin_adjust_balance', {
        p_user_id: topup.userId,
        p_amount: Math.round(topup.amount),
        p_note: `Admin duyá»‡t náº¡p tiá»n ${topup.transferNote || ''}`,
      });
      if (rpcErr) {
        // RPC chÆ°a cÃ³ â†’ fallback update trá»±c tiáº¿p báº£ng profiles
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', topup.userId);
        if (updateErr) {
          console.warn('[approveTopup] KhÃ´ng thá»ƒ Ä‘á»“ng bá»™ sá»‘ dÆ° lÃªn Cloud:', updateErr.message);
        }
      } else {
        // RPC thÃ nh cÃ´ng â†’ láº¥y sá»‘ dÆ° tháº­t tá»« káº¿t quáº£
        const r = rpcResult as { status?: string; balance?: number } | null;
        if (r?.status === 'success' && r.balance !== undefined) {
          setUsers((prev) =>
            prev.map((u) => (u.id === topup.userId ? { ...u, balance: Number(r.balance) } : u))
          );
        }
      }
      // Cáº­p nháº­t topup status trÃªn cloud
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
      description: `Náº¡p tiá»n qua ${topup.method} (${topup.transferNote})`,
      amount: topup.amount,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
    };
    setTransactions((prev) => [newTx, ...prev]);

    showToast(
      `ÄÃ£ duyá»‡t náº¡p tiá»n ${topup.amount.toLocaleString('vi-VN')}Ä‘ cho ${topup.userName}!`,
      'success'
    );
  };

  const rejectTopup = (id: string, reason: string) => {
    const topup = topups.find((t) => t.id === id);
    if (!topup || topup.status !== 'pending') {
      showToast('YÃªu cáº§u náº¡p nÃ y Ä‘Ã£ Ä‘Æ°á»£c xá»­ lÃ½ trÆ°á»›c Ä‘Ã³', 'warning');
      return;
    }

    setTopups((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'rejected',
              rejectReason: reason || 'Giao dá»‹ch khÃ´ng khá»›p sao kÃª',
              processedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : t
      )
    );
    showToast('ÄÃ£ tá»« chá»‘i yÃªu cáº§u náº¡p tiá»n', 'error');
  };

  const createTopupRequest = (
    amount: number,
    method: TopupRequest['method'],
    transferNote: string,
    proofImage?: string
  ): string => {
    const buyer = currentUser;
    // Kill switch: cháº¿ Ä‘á»™ báº£o trÃ¬ â†’ khÃ´ng nháº­n náº¡p má»›i
    if (settings.maintenanceMode) {
      showToast('Há»‡ thá»‘ng Ä‘ang báº£o trÃ¬ táº¡m thá»i â€” chÆ°a nháº­n yÃªu cáº§u náº¡p má»›i!', 'warning');
      return '';
    }
    // Rate limit: tá»‘i Ä‘a 5 yÃªu cáº§u náº¡p Ä‘ang chá» / ngÆ°á»i dÃ¹ng (chá»‘ng spam)
    const pendingCount = topups.filter((t) => t.userId === buyer.id && t.status === 'pending').length;
    if (pendingCount >= 1) {
      showToast('Bạn đang có 1 yêu cầu nạp chưa hoàn tất. Vui lòng chờ Admin duyệt mã trước đó!', 'error');
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
        title: `YÃªu cáº§u náº¡p tiá»n má»›i ${newTopup.requestCode}`,
        description: `${buyer.username} gá»­i yÃªu cáº§u náº¡p ${amount.toLocaleString('vi-VN')}Ä‘ qua ${method}`,
        time: 'Vá»«a xong',
        read: false,
        type: 'topup',
      },
      ...prev,
    ]);

    // === ÄÆ¯á»œNG Náº P THáº¬T (THUEAPIBANK â€” MB Bank qua THUEAPI): ghi topup lÃªn Cloud
    // Ä‘á»ƒ webhook /api/webhook/mbbank match transfer_note vÃ  duyá»‡t tá»± Ä‘á»™ng qua RPC
    // process_bank_webhook. Cáº§n policy "topups_insert_own" trong security_fix_rls.sql;
    // náº¿u chÆ°a cháº¡y SQL thÃ¬ bá» qua im láº·ng vÃ  váº«n giá»¯ luá»“ng local nhÆ° cÅ©. ===
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
          console.warn('[Topup] ChÆ°a Ä‘á»“ng bá»™ Cloud (cháº¡y security_fix_rls.sql Ä‘á»ƒ báº­t):', cloudErr?.message || 'no row');
          return;
        }
        // Polling tráº¡ng thÃ¡i: khi webhook duyá»‡t THáº¬T trÃªn DB â†’ cá»™ng sá»‘ dÆ° theo nguá»“n tháº­t
        const pollId = cloudTopup.id;
        let tries = 0;
        const timer = setInterval(async () => {
          tries++;
          try {
            const { data: t } = await supabase.from('topups').select('status').eq('id', pollId).maybeSingle();
            if (t?.status === 'approved') {
              clearInterval(timer);
              // Láº¥y sá»‘ dÆ° tháº­t tá»« profiles (webhook RPC Ä‘Ã£ cá»™ng trÃªn DB)
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
              showToast(`ðŸŽ‰ Webhook ngÃ¢n hÃ ng xÃ¡c nháº­n: +${amount.toLocaleString('vi-VN')}Ä‘ vÃ o vÃ­!`, 'success');
            }
          } catch {}
          if (tries >= 30) clearInterval(timer); // dá»«ng sau ~5 phÃºt
        }, 10000);
      } catch {}
    })();

    // âš ï¸ KHÃ”NG cÃ²n "auto credit simulator" phÃ­a client â€” tiá»n chá»‰ Ä‘Æ°á»£c cá»™ng khi
    // webhook/cron THUEAPIBANK xÃ¡c nháº­n giao dá»‹ch THáº¬T trÃªn server (RPC cá»™ng
    // vÃ­ + ghi ledger trong 1 DB transaction). Polling phÃ­a trÃªn sáº½ tá»± cáº­p nháº­t
    // sá»‘ dÆ° hiá»ƒn thá»‹ theo nguá»“n tháº­t khi topup Ä‘Æ°á»£c duyá»‡t.
    showToast(
      `ÄÃ£ táº¡o yÃªu cáº§u náº¡p ${amount.toLocaleString('vi-VN')}Ä‘ (${newTopup.transferNote}). Chuyá»ƒn khoáº£n Ä‘Ãºng ná»™i dung â€” há»‡ thá»‘ng tá»± Ä‘á»™ng cá»™ng vÃ­ khi ngÃ¢n hÃ ng xÃ¡c nháº­n.`,
      'info'
    );
    return generatedCode;
  };

  // Card Recharge (Náº¡p tháº» cÃ o) Actions
  const createCardRecharge = (
    network: CardNetwork,
    declaredAmount: number,
    serial: string,
    pin: string
  ): { success: boolean; message: string } => {
    if (!isAuthenticated) {
      return { success: false, message: 'Vui lÃ²ng Ä‘Äƒng nháº­p tÃ i khoáº£n trÆ°á»›c khi náº¡p tháº»!' };
    }

    if (!serial.trim() || !pin.trim()) {
      return { success: false, message: 'Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ sá»‘ Serial vÃ  MÃ£ tháº» (PIN)!' };
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
        title: `Náº¡p tháº» cÃ o má»›i ${cardCode}`,
        description: `${currentUser.username} náº¡p tháº» ${network} ${declaredAmount.toLocaleString('vi-VN')}Ä‘ (Thá»±c nháº­n: ${receivedAmount.toLocaleString('vi-VN')}Ä‘)`,
        time: 'Vá»«a xong',
        read: false,
        type: 'card',
      },
      ...prev,
    ]);

    showToast(`ÄÃ£ gá»­i tháº» cÃ o ${network} ${declaredAmount.toLocaleString('vi-VN')}Ä‘ lÃªn há»‡ thá»‘ng xá»­ lÃ½!`, 'success');
    return { success: true, message: `Tháº» cÃ o ${cardCode} Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n vÃ  Ä‘ang Ä‘Æ°á»£c kiá»ƒm tra.` };
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
      description: `Náº¡p tháº» cÃ o ${card.network} ${card.declaredAmount.toLocaleString('vi-VN')}Ä‘ thÃ nh cÃ´ng (+${card.receivedAmount.toLocaleString('vi-VN')}Ä‘ vÃ o vÃ­)`,
      amount: card.receivedAmount,
      balanceAfter: newBalance,
      createdAt: nowStr,
      status: 'completed',
    };
    setTransactions((prev) => [newTx, ...prev]);

    showToast(`ÄÃ£ duyá»‡t tháº» cÃ o ${card.code} vÃ  cá»™ng ${card.receivedAmount.toLocaleString('vi-VN')}Ä‘ vÃ o vÃ­ khÃ¡ch hÃ ng ${card.userName}!`, 'success');
  };

  const rejectCardRecharge = (id: string, reason: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setCardRecharges((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: 'invalid', processedAt: nowStr, note: reason } : c
      )
    );
    showToast('ÄÃ£ tá»« chá»‘i tháº» cÃ o khÃ´ng há»£p lá»‡', 'info');
  };

  // Seller Program Actions
  const applySeller = (note?: string): { success: boolean; message: string } => {
    if (!isAuthenticated) {
      return { success: false, message: 'Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ Ä‘Äƒng kÃ½ trá»Ÿ thÃ nh Äáº¡i LÃ½ / Seller!' };
    }

    if (currentUser.sellerStatus === 'approved') {
      return { success: false, message: 'Báº¡n Ä‘Ã£ lÃ  Äáº¡i LÃ½ / Seller cá»§a Thanox!' };
    }

    if (currentUser.sellerStatus === 'pending') {
      return { success: false, message: 'YÃªu cáº§u Ä‘Äƒng kÃ½ Äáº¡i LÃ½ cá»§a báº¡n Ä‘ang chá» Admin phÃª duyá»‡t!' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              sellerStatus: 'pending',
              sellerNote: note || 'ÄÄƒng kÃ½ chÆ°Æ¡ng trÃ¬nh Äáº¡i LÃ½ Thanox',
              sellerAppliedAt: nowStr,
            }
          : u
      )
    );

    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: 'ÄÄƒng kÃ½ Äáº¡i LÃ½ / Seller má»›i',
        description: `ThÃ nh viÃªn ${currentUser.username} vá»«a Ä‘Äƒng kÃ½ trá»Ÿ thÃ nh Äáº¡i LÃ½ / CTV`,
        time: 'Vá»«a xong',
        read: false,
        type: 'seller',
      },
      ...prev,
    ]);

    showToast('ÄÃ£ gá»­i yÃªu cáº§u Ä‘Äƒng kÃ½ Äáº¡i LÃ½! Admin sáº½ duyá»‡t tÃ i khoáº£n cá»§a báº¡n sá»›m nháº¥t.', 'success');
    return { success: true, message: 'ÄÄƒng kÃ½ thÃ nh cÃ´ng, vui lÃ²ng chá» duyá»‡t!' };
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
    showToast(`ÄÃ£ cáº­p nháº­t tráº¡ng thÃ¡i Äáº¡i LÃ½ cá»§a tÃ i khoáº£n sang "${status}"`, 'info');
  };

  // Auth Operations
  const login = async (identifier: string, password: string, _rememberMe = true): Promise<{ success: boolean; message?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) return { success: false, message: 'Vui lÃ²ng nháº­p tÃªn Ä‘Äƒng nháº­p hoáº·c email' };

    // === CHá»NG DÃ’ Máº¬T KHáº¨U (brute force): 5 láº§n sai liÃªn tiáº¿p => khÃ³a 5 phÃºt ===
    try {
      const raw = localStorage.getItem('thanox_login_guard');
      if (raw) {
        const guard = JSON.parse(raw) as { fails: number; lockedUntil?: number };
        if (guard.lockedUntil && Date.now() < guard.lockedUntil) {
          const secs = Math.ceil((guard.lockedUntil - Date.now()) / 1000);
          return { success: false, message: `Báº¡n Ä‘Ã£ nháº­p sai quÃ¡ nhiá»u láº§n. Vui lÃ²ng thá»­ láº¡i sau ${secs} giÃ¢y.` };
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
          return { success: false, message: g.lockedUntil ? 'Báº¡n Ä‘Ã£ nháº­p sai quÃ¡ nhiá»u láº§n. Vui lÃ²ng thá»­ láº¡i sau 5 phÃºt.' : `Sai tÃ i khoáº£n hoáº·c máº­t kháº©u. (CÃ²n ${5 - g.fails} láº§n thá»­)` };
        }
      }
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });
      if (authError || !authData.user) {
        const g = recordLoginFail();
        if (g.lockedUntil) {
          return { success: false, message: 'Báº¡n Ä‘Ã£ nháº­p sai quÃ¡ nhiá»u láº§n. TÃ i khoáº£n bá»‹ khÃ³a táº¡m 5 phÃºt.' };
        }
        // Give users an actionable message for unconfirmed emails instead of a generic one
        if (authError?.message?.toLowerCase().includes('email not confirmed')) {
          return { success: false, message: 'TÃ i khoáº£n chÆ°a xÃ¡c nháº­n email. Vui lÃ²ng kiá»ƒm tra há»™p thÆ° (cáº£ má»¥c Spam) vÃ  báº¥m link kÃ­ch hoáº¡t.' };
        }
        return { success: false, message: `Sai tÃ i khoáº£n hoáº·c máº­t kháº©u. (CÃ²n ${5 - g.fails} láº§n thá»­)` };
      }

      // ÄÄƒng nháº­p thÃ nh cÃ´ng => xÃ³a bá»™ Ä‘áº¿m sai
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
      return { success: false, message: 'Lá»—i mÃ¡y chá»§, vui lÃ²ng thá»­ láº¡i.' };
    }
  };

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) return { success: false, message: 'TÃªn Ä‘Äƒng nháº­p pháº£i cÃ³ Ã­t nháº¥t 3 kÃ½ tá»±.' };
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) return { success: false, message: 'TÃªn Ä‘Äƒng nháº­p chá»‰ bao gá»“m chá»¯ cÃ¡i, sá»‘ vÃ  dáº¥u gáº¡ch dÆ°á»›i (_).' };
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) return { success: false, message: 'Äá»‹a chá»‰ email khÃ´ng há»£p lá»‡.' };
    if (!password || password.length < 6) return { success: false, message: 'Máº­t kháº©u pháº£i cÃ³ Ã­t nháº¥t 6 kÃ½ tá»±.' };
    try {
      const { data: existingUser } = await supabase.from('profiles').select('username').eq('username', cleanUsername).single();
      if (existingUser) return { success: false, message: 'TÃªn Ä‘Äƒng nháº­p Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng.' };
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: { data: { username: cleanUsername } }
      });
      if (authError) {
        let msg = 'ÄÄƒng kÃ½ khÃ´ng thÃ nh cÃ´ng.';
        const m = authError.message.toLowerCase();
        if (m.includes('already registered') || m.includes('already been registered')) {
          msg = 'Email nÃ y Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng.';
        } else if (m.includes('rate limit')) {
          msg = 'Báº¡n Ä‘Ã£ Ä‘Äƒng kÃ½ quÃ¡ nhiá»u láº§n. Vui lÃ²ng thá»­ láº¡i sau Ã­t phÃºt.';
        }
        return { success: false, message: msg };
      }
      // ThÃªm user má»›i vÃ o local state ngay láº­p tá»©c Ä‘á»ƒ hiá»ƒn thá»‹ trong admin panel
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
      showToast('ÄÄƒng kÃ½ tÃ i khoáº£n thÃ nh cÃ´ng! Vui lÃ²ng kiá»ƒm tra email Ä‘á»ƒ kÃ­ch hoáº¡t tÃ i khoáº£n trÆ°á»›c khi Ä‘Äƒng nháº­p.', 'success');
      return { success: true };
    } catch (err) {
      return { success: false, message: 'ÄÃ£ xáº£y ra lá»—i káº¿t ná»‘i. Vui lÃ²ng thá»­ láº¡i sau.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUserId(null);
    showToast('ÄÃ£ Ä‘Äƒng xuáº¥t khá»i há»‡ thá»‘ng', 'info');
  };

  // Forgot Password: Email normalization & OTP generation
  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message?: string; otp?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, message: 'Lá»—i khi gá»­i email xÃ¡c thá»±c.' };
      return { success: true, message: 'ÄÃ£ gá»­i email khÃ´i phá»¥c máº­t kháº©u.' };
    } catch (err) {
      return { success: false, message: 'Lá»—i mÃ¡y chá»§.' };
    }
  };

  const resetPassword = async (email: string, otpOrToken: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otpOrToken, type: 'recovery' });
      if (error) return { success: false, message: 'MÃ£ xÃ¡c thá»±c khÃ´ng há»£p lá»‡.' };
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) return { success: false, message: 'KhÃ´ng thá»ƒ cáº­p nháº­t máº­t kháº©u.' };
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Lá»—i mÃ¡y chá»§.' };
    }
  };

  // Admin Direct Password Reset for Customer Assistance
  const adminResetPassword = async (userId: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    if (!newPass || newPass.length < 6) {
      return { success: false, message: 'Máº­t kháº©u má»›i pháº£i cÃ³ Ã­t nháº¥t 6 kÃ½ tá»±!' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPass } : u))
    );

    showToast('ÄÃ£ Ä‘áº·t láº¡i máº­t kháº©u má»›i cho tÃ i khoáº£n khÃ¡ch hÃ ng thÃ nh cÃ´ng!', 'success');
    return { success: true, message: 'Máº­t kháº©u Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t.' };
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...updates } : u))
    );
    showToast('ÄÃ£ cáº­p nháº­t há»“ sÆ¡ cÃ¡ nhÃ¢n thÃ nh cÃ´ng!', 'success');
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
      showToast('ÄÃ£ cáº­p nháº­t thÃ´ng tin ngÆ°á»i dÃ¹ng trÃªn Cloud', 'success');
    } catch (e) {
      console.error(e);
      showToast('Lá»—i khi cáº­p nháº­t trÃªn Cloud', 'error');
    }
  };

  const deleteUser = async (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    if (target.role === 'admin' || target.username === 'admin') {
      showToast('KhÃ´ng thá»ƒ xÃ³a tÃ i khoáº£n Quáº£n trá»‹ viÃªn Master (Super Admin)', 'error');
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
      showToast(`ÄÃ£ xÃ³a tÃ i khoáº£n ${target.username} trÃªn Cloud thÃ nh cÃ´ng`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Lá»—i khi xÃ³a tÃ i khoáº£n trÃªn Cloud', 'error');
    }
  };

  const adjustUserBalance = async (userId: string, amount: number, note: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    // SERVER-SIDE: RPC admin_adjust_balance â€” cá»™ng Ä‘Ãºng báº£ng profiles (sá»‘ dÆ° tháº­t),
    // khÃ³a dÃ²ng, ghi ledger + audit_log. KHÃ”NG sá»­a balance trá»±c tiáº¿p á»Ÿ client.
    try {
      const { data, error } = await supabase.rpc('admin_adjust_balance', {
        p_user_id: userId,
        p_amount: Math.round(amount),
        p_note: note || '',
      });
      if (error) throw error;
      const r = data as { status?: string; code?: string; balance?: number } | null;
      if (r?.status !== 'success') {
        showToast(r?.code === 'FORBIDDEN' ? 'Báº¡n khÃ´ng cÃ³ quyá»n Ä‘iá»u chá»‰nh sá»‘ dÆ°!' : 'KhÃ´ng thá»ƒ Ä‘iá»u chá»‰nh sá»‘ dÆ° (' + (r?.code || 'lá»—i') + ')', 'error');
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
        description: `Äiá»u chá»‰nh sá»‘ dÆ° bá»Ÿi Admin (${note || 'Thao tÃ¡c thá»§ cÃ´ng'})`,
        amount,
        balanceAfter: newBalance,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'completed',
      };
      setTransactions((prev) => [newTx, ...prev]);
      showToast(
        `ÄÃ£ ${amount >= 0 ? 'cá»™ng' : 'trá»«'} ${Math.abs(amount).toLocaleString('vi-VN')}Ä‘ vÃ o vÃ­ cá»§a ${targetUser.username} (sá»‘ dÆ° má»›i: ${newBalance.toLocaleString('vi-VN')}Ä‘)`,
        'success'
      );
    } catch (e) {
      console.error(e);
      showToast('Lá»—i Ä‘iá»u chá»‰nh sá»‘ dÆ° (server)', 'error');
    }
  };

  // ADMIN HOÃ€N TIá»€N ÄÆ N CLOUD â€” RPC admin_refund_order: cá»™ng láº¡i vÃ­ Ä‘Ãºng 1 láº§n,
  // Ä‘Æ¡n -> refunded, ledger REFUND + audit. KHÃ”NG sá»­a lá»‹ch sá»­ gá»‘c.
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
          r?.code === 'ALREADY_REFUNDED' ? 'ÄÆ¡n nÃ y Ä‘Ã£ Ä‘Æ°á»£c hoÃ n tiá»n trÆ°á»›c Ä‘Ã³!' :
          r?.code === 'NOT_REFUNDABLE' ? 'Chá»‰ hoÃ n tiá»n Ä‘Æ°á»£c Ä‘Æ¡n Ä‘Ã£ hoÃ n thÃ nh!' :
          r?.code === 'FORBIDDEN' ? 'Báº¡n khÃ´ng cÃ³ quyá»n hoÃ n tiá»n!' : 'KhÃ´ng thá»ƒ hoÃ n tiá»n (' + (r?.code || 'lá»—i') + ')',
          'error'
        );
        return false;
      }
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'refunded' as const } : o)));
      showToast(`âœ… ÄÃ£ hoÃ n ${(r.refunded ?? 0).toLocaleString('vi-VN')}Ä‘ vÃ o vÃ­ khÃ¡ch (ledger REFUND + audit Ä‘Ã£ ghi)`, 'success');
      return true;
    } catch (e) {
      console.error(e);
      showToast('Lá»—i hoÃ n tiá»n (server)', 'error');
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
      showToast(`ÄÃ£ ${newStatus === 'banned' ? 'khÃ³a' : 'má»Ÿ khÃ³a'} tÃ i khoáº£n ${user.username} trÃªn Cloud`, newStatus === 'banned' ? 'error' : 'success');
    } catch (e) {
      console.error(e);
      showToast('Lá»—i cáº­p nháº­t tráº¡ng thÃ¡i lÃªn Cloud', 'error');
    }
  };

  // Support Tickets
  const sendTicketMessage = (ticketId: string, message: string, sender: 'admin' | 'user' = 'admin') => {
    const timeNow = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: 'm-' + Date.now(),
      sender,
      senderName: sender === 'admin' ? 'Thanox Admin' : (currentUser?.username || 'KhÃ¡ch hÃ ng'),
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
      showToast('ÄÃ£ gá»­i pháº£n há»“i tá»›i khÃ¡ch hÃ ng', 'success');
    }
  };

  const updateTicketStatus = (ticketId: string, status: SupportTicket['status']) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
    showToast(`ÄÃ£ cáº­p nháº­t tráº¡ng thÃ¡i ticket sang "${status}"`, 'info');
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
        title: `Ticket má»›i ${newTicket.ticketNumber}`,
        description: `${buyer.username}: ${subject}`,
        time: 'Vá»«a xong',
        read: false,
        type: 'ticket',
      },
      ...prev,
    ]);

    showToast(`ÄÃ£ gá»­i yÃªu cáº§u há»— trá»£ "${newTicket.ticketNumber}"`, 'success');
    return newTicket.id;
  };

  const createTicket = (subject: string, message: string): string => {
    return createSupportTicket(subject, 'Há»— trá»£ ká»¹ thuáº­t', message);
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
    showToast('ÄÃ£ lÆ°u cáº¥u hÃ¬nh há»‡ thá»‘ng thÃ nh cÃ´ng', 'success');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('ÄÃ£ Ä‘Ã¡nh dáº¥u Ä‘á»c táº¥t cáº£ thÃ´ng bÃ¡o', 'info');
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
    showToast('ÄÃ£ Ä‘áº·t láº¡i dá»¯ liá»‡u máº«u (Ä‘Ã£ báº£o vá»‡ cÃ¡c sáº£n pháº©m Ä‘ang KHÃ“A)!', 'success');
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
    showToast('ÄÃ£ xÃ³a tráº¯ng toÃ n bá»™ dá»¯ liá»‡u máº«u!', 'warning');
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




