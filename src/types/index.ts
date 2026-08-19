export type PageId =
  | 'dashboard'
  | 'analytics'
  | 'products'
  | 'categories'
  | 'orders'
  | 'wallet'
  | 'transactions'
  | 'affiliate'
  | 'users'
  | 'support'
  | 'settings';

export type ProductStatus = 'active' | 'hidden' | 'out_of_stock';

export interface ProductPlan {
  id: string;
  name: string; // e.g. '1 THÁNG', '3 THÁNG', '1 NĂM', 'VĨNH VIỄN'
  price: number;
  keys?: string;
  downloadUrl?: string;
}

export type ProductPackage = ProductPlan;

export interface Product {
  id: string;
  name: string;
  category: string;
  basePrice?: number;
  price: number; // Base Price / Giá gốc
  memberPrice?: number; // Member price (default = price)
  sellerPrice?: number; // Seller price (default = memberPrice, configurable by Admin)
  isSale?: boolean; // Admin bật/tắt giảm giá SALE
  salePrice?: number; // Giá sale khi bật isSale
  saleActive?: boolean; // Alias for isSale
  originalPrice?: number;
  soldCount: number;
  sold?: number;
  stock: number | 'unlimited';
  status: ProductStatus;
  description: string;
  downloadLinkOrKeys: string;
  downloadUrl?: string;
  licenseKeys?: string;
  instructions?: string;
  featured: boolean;
  isLocked?: boolean; // Khóa sản phẩm chống ghi đè khi nâng cấp hệ thống / reset
  image?: string;
  images?: string[];
  primaryImage?: string;
  updatedAt?: string;
  plans?: ProductPlan[]; // Danh sách gói thời hạn
  packages?: ProductPlan[]; // Alias for backward compatibility
  productType?: 'key' | 'account' | 'file';
  accountUsername?: string;
  accountPassword?: string;
  account2FA?: string;
  accountsList?: string; // Danh sách tài khoản: tk|mk hoặc tk|mk|2fa (mỗi dòng 1 nick)
  attachedFileName?: string; // Tên tệp đính kèm tải lên (VD: Thanox_v5.4.1.apk, menu.zip...)
  attachedFileSize?: string; // Kích thước tệp (VD: 45.2 MB)
  attachedFileData?: string; // Data base64 / URL của tệp để tải trực tiếp
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image?: string;
  count: number;
  status: 'active' | 'hidden';
  sortOrder?: number;
}

export type OrderStatus = 'completed' | 'pending' | 'processing' | 'failed' | 'cancelled';

export interface Order {
  id: string;
  orderCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  productId: string;
  productName: string;
  category: string;
  productCategory?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  totalAmount?: number;
  paymentMethod: 'wallet' | 'bank' | 'card';
  status: OrderStatus;
  createdAt: string;
  deliveredContent?: string;
  key?: string;
  packageName?: string;
  isSellerOrder?: boolean;
}

export type UserRole = 'user' | 'vip' | 'seller' | 'affiliate' | 'admin';
export type UserStatus = 'active' | 'banned';
export type SellerStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'suspended';

export interface User {
  id: string;
  username: string;
  name?: string;
  email: string;
  phone?: string;
  role: UserRole;
  balance: number;
  affiliateBalance?: number;
  referredBy?: string;
  refCode?: string;
  sellerStatus?: SellerStatus;
  sellerNote?: string;
  sellerAppliedAt?: string;
  sellerApprovedAt?: string;
  totalOrders: number;
  totalSpent: number;
  status: UserStatus;
  createdAt: string;
  avatarText?: string;
  password?: string;
}

export type TopupStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'expired' | 'cancelled';

export interface TopupRequest {
  id: string;
  requestCode: string;
  userId: string;
  userName: string;
  amount: number;
  method: 'Bank Transfer' | 'Th? co';
  proofImage?: string;
  transferNote: string;
  createdAt: string;
  status: TopupStatus;
  processedAt?: string;
  rejectReason?: string;
}

export type CardNetwork = 'Viettel' | 'Vinaphone' | 'Mobifone' | 'Vietnamobile' | 'Zing' | 'Garena';
export type CardStatus = 'pending' | 'processing' | 'success' | 'failed' | 'invalid';

export interface CardRechargeRequest {
  id: string;
  code: string;
  userId: string;
  userName: string;
  network: CardNetwork;
  declaredAmount: number;
  receivedAmount: number;
  serial: string;
  pin: string;
  status: CardStatus;
  createdAt: string;
  processedAt?: string;
  note?: string;
}

export interface CardSettings {
  enabled: boolean;
  feePercentage: number; // Chiết khấu hệ thống (ví dụ 15%)
  userReceiveRate?: number; // % Thực nhận của user vào ví (ví dụ 85%)
  networkRates?: Partial<Record<CardNetwork, number>>; // % Thực nhận theo từng nhà mạng
  minAmount: number;
  maxAmount: number;
  allowedNetworks: CardNetwork[];
  maintenanceMessage?: string;
}

export type TransactionType = 'purchase' | 'deposit' | 'withdraw' | 'commission' | 'adjustment' | 'card_recharge';

export interface Transaction {
  id: string;
  txCode: string;
  type: TransactionType;
  userId: string;
  userName: string;
  description: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
  status: 'completed' | 'processing' | 'failed';
}

export interface AffiliateItem {
  id: string;
  userId: string;
  userName: string;
  refCode: string;
  code?: string;
  clicks: number;
  totalClicks?: number;
  successfulOrders: number;
  totalConversions?: number;
  commissionEarned: number;
  totalEarnings?: number;
  pendingWithdraw: number;
  pendingBalance?: number;
  commissionRate?: number;
  status: 'active' | 'paused';
  createdAt?: string;
}

export interface TicketMessage {
  id: string;
  sender: 'user' | 'admin';
  senderRole?: 'user' | 'admin';
  senderName: string;
  avatar?: string;
  message: string;
  time: string;
  createdAt?: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  subject: string;
  relatedOrderCode?: string;
  category: string;
  status: 'open' | 'processing' | 'closed';
  priority: 'normal' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface AffiliateReward {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referredUserName: string;
  orderId: string;
  orderCode: string;
  orderAmount: number;
  rewardAmount: number;
  createdAt: string;
  status: 'completed' | 'reversed';
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  autoPlay?: boolean;
}

export interface CardDenominationConfig {
  amount: number;
  receiveAmount: number;
  feePercent: number;
  enabled: boolean;
}

export interface CardSettings {
  enabled: boolean;
  feePercentage: number;
  userReceiveRate?: number;
  wrongAmountAction?: string;
  maxPerUserPerMinute?: number;
  maxPerUserPerDay?: number;
  networkMatrix?: Record<string, CardDenominationConfig[]>;
  allowedNetworks?: string[];
  minAmount?: number;
  maxAmount?: number;
}

export interface StoreEffects {
  glassEffect: boolean;
  avatarFrame: boolean;
  gradientName: boolean;
  largeTitle: boolean;
  motion: boolean;
  autoMusic: boolean;
}

export interface TypographySettings {
  fontFamily: 'Space Grotesk' | 'Plus Jakarta Sans' | 'Inter' | 'Manrope' | 'Outfit' | 'Orbitron';
  titleWeight: 'bold' | 'extrabold' | 'black';
  enableColorFlow: boolean;
  colorMode: 'rainbow_flow' | 'pure_white' | 'cyber_cyan' | 'neon_purple' | 'flame_fire';
  enableTextGlow: boolean;
  enableChunkyTitles: boolean;
  applyToNavAndButtons: boolean;
  applyToSectionHeadings: boolean;
}

export interface HeroBannerSettings {
  backgroundImage: string;
  brightness: number; // 10 - 100%
  blur: number; // 0 - 10px
  overlayOpacity: number; // 0 - 100%
  glowEffect: boolean;
  hotlineZalo: string;
  telegramContact?: string;
}

export interface StoreSettings {
  storeName: string;
  storeDescription: string;
  zaloHotline: string;
  telegramLink: string;
  botUsername?: string;
  facebookFanpage: string;
  typography?: TypographySettings;
  
  // Banking / VietQR Config
  bankEnabled: boolean;
  bankName: string;
  bankCode: string;
  bankAccount: string;
  accountHolder: string;
  transferPrefix: string;
  minDeposit: number;
  maxDeposit: number;
  qrTemplate: string;
  bankInfo?: string;

  // Card Recharge Config
  scratchCardEnabled: boolean;
  cardSettings: CardSettings;

  // Announcement bar
  announcementText: string;
  announcementEnabled: boolean;

  // Security & System
  enable2FA: boolean;
  rateLimiting: boolean;
  adminLogs: boolean;
  maintenanceMode: boolean;
  sessionTimeoutMinutes: number;
  
  // Affiliate Configuration (Daily Cap + Qualifying order >= 200k)
  affiliateEnabled: boolean;
  affiliateCommissionRate: number;
  affiliateMinWithdraw: number;
  affiliateDailyCap: number; // M?c nh?n thu?ng t?i da / ngu?i / ngy (VN)
  affiliateMinimumOrderValue: number; // on t?i thi?u d? tnh thu?ng (200.000d)
  affiliateDefaultReward: number; // M?c thu?ng m?c d?nh (10.000d)
  affiliateHigherTierEnabled: boolean;
  affiliateHigherTierThreshold: number; // M?c thu?ng cao (300.000d)
  affiliateHigherTierReward: number; // M?c thu?ng cao (30.000d)

  // Music & Effects
  musicEnabled: boolean;
  musicTracks: MusicTrack[];
  effects: StoreEffects;

  // Hero Banner Customizer
  heroBanner?: HeroBannerSettings;
}

export type StorefrontPageId =
  | 'home'
  | 'products'
  | 'product-detail'
  | 'categories'
  | 'cart'
  | 'checkout'
  | 'account'
  | 'account-orders'
  | 'account-wallet'
  | 'account-wallet-deposit'
  | 'account-transactions'
  | 'account-support'
  | 'account-seller'
  | 'support'
  | 'affiliate';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedPackage?: ProductPackage;
}

export interface ToastNotification {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'order' | 'topup' | 'ticket' | 'system' | 'seller' | 'card';
}
