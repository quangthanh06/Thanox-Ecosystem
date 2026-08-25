export type PageId =
  | 'dashboard'
  | 'analytics'
  | 'products'
  | 'categories'
  | 'orders'
  | 'wallet'
  | 'transactions'
  | 'affiliate'
  | 'theme-settings'
  | 'payment-settings'
  | 'maintenance-settings'
  | 'security-settings'
  | 'music-settings'
  | 'users'
  | 'support'
  | 'settings';

export type ProductStatus = 'active' | 'hidden' | 'out_of_stock';

export interface ProductPlan {
  id: string;
  name: string; // e.g. '1 THÁNG', '3 THÁNG', '1 NĂM', 'VĨNH VIỄN'
  price: number;
  originalPrice?: number;
  sellerPrice?: number;
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

export type OrderStatus = 'completed' | 'pending' | 'processing' | 'failed' | 'cancelled' | 'refunded';

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
export type SellerStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'suspended' | 'active';

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
  joinDate?: string;
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
  method: 'Bank Transfer' | 'Thẻ cào' | 'bank' | 'card' | 'momo';
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

export interface CardDenominationConfig {
  amount: number;
  receiveAmount: number;
  feePercent: number;
  enabled: boolean;
}

export interface StoreEffects {
  glassEffect?: boolean;
  avatarFrame?: boolean;
  gradientName?: boolean;
  largeTitle?: boolean;
  motion?: boolean;
  autoMusic?: boolean;
  snow?: boolean;
  cherryBlossom?: boolean;
}

export interface TypographySettings {
  fontFamily:
    | 'Space Grotesk'
    | 'Plus Jakarta Sans'
    | 'Inter'
    | 'Manrope'
    | 'Outfit'
    | 'Orbitron'
    | 'Be Vietnam Pro'
    | 'Montserrat'
    | 'Roboto'
    | 'Times New Roman'
    | 'Arial';
  titleWeight: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
  fontSizeScale?: 'small' | 'normal' | 'large' | 'xlarge' | 'xxlarge';
  enableColorFlow: boolean;
  colorMode: 'rainbow_flow' | 'pure_white' | 'cyber_cyan' | 'neon_purple' | 'flame_fire';
  enableTextGlow: boolean;
  enableChunkyTitles: boolean;
  applyToNavAndButtons: boolean;
  applyToSectionHeadings: boolean;
}

export interface HeroBannerSettings {
  backgroundImage?: string;
  backgroundVideo?: string;
  backgroundType?: 'image' | 'video';
  brightness: number; // 10 - 100%
  blur: number; // 0 - 10px
  overlayOpacity: number; // 0 - 100%
  glowEffect: boolean;
  hotlineZalo: string;
  telegramContact?: string;
}

export interface LogoSettings {
  logoUrl?: string; // Tùy chỉnh URL ảnh logo
  showBorder?: boolean; // Bật / Tắt viền phát sáng (true/false)
  borderStyle?: 'purple_cyan' | 'cyan' | 'purple' | 'gold' | 'emerald' | 'crimson' | 'none';
  borderGlow?: boolean; // Hiệu ứng tỏa sáng neon
  shape?: 'squircle' | 'circle' | 'rounded' | 'square'; // Hình dáng bo góc
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Kích thước: 36px, 44px, 52px, 64px
  scale?: number; // Độ thu phóng ảnh trong khung (100 - 150%)
}

export interface StoreSettings {
  storeName: string;
  storeDescription: string;
  zaloHotline: string;
  telegramLink: string;
  botUsername?: string;
  facebookFanpage: string;
  typography?: TypographySettings;
  logoSettings?: LogoSettings;
  aiBotSize?: 'small' | 'medium' | 'large';
  
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
  announcementBar?: {
    enabled?: boolean;
    text?: string;
    linkText?: string;
    linkUrl?: string;
  };

  // Security & System
  enable2FA: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCode?: string;
  rateLimiting: boolean;
  adminLogs: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  adminZalo?: string;
  adminHotline?: string;
  adminTelegram?: string;
  telegramAdminId?: string;
  antiInspectEnabled?: boolean;
  antiDDoSEnabled?: boolean;
  antiBotShield?: boolean;
  blockedIps?: string[];
  whitelistedIps?: string[];
  securityMode?: 'strict' | 'normal' | 'auto_shield';
  sessionTimeoutMinutes: number;
  autoApprovalEnabled?: boolean;
  
  // Affiliate Configuration (Daily Cap + Qualifying order >= 200k)
  affiliateEnabled: boolean;
  affiliateCommissionRate: number;
  affiliateMinWithdraw: number;
  affiliateDailyCap: number; // Mức nhận thưởng tối đa / người / ngày (VNĐ)
  affiliateMinimumOrderValue: number; // Đơn tối thiểu để tính thưởng (200.000đ)
  affiliateDefaultReward: number; // Mức thưởng mặc định (10.000đ)
  affiliateHigherTierEnabled: boolean;
  affiliateHigherTierThreshold: number; // Mức thưởng cao (300.000đ)
  affiliateHigherTierReward: number; // Mức thưởng cao (30.000đ)

  // Music & Effects
  musicEnabled: boolean;
  musicTracks: MusicTrack[];
  effects: StoreEffects;

  // Hero Banner Customizer
  heroBanner?: HeroBannerSettings;

  // Gói dịch vụ theo sản phẩm (map productId -> packages), đồng bộ qua store_settings
  productPackages?: Record<string, ProductPackage[]>;
}

export type StorefrontPageId =
  | 'home'
  | 'login'
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


