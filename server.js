import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');
const dataDir = path.join(__dirname, 'data');
const dbFile = path.join(dataDir, 'db.json');

// Ensure data folder exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial seed if db.json does not exist
const getInitialDB = () => {
  return {
    users: [
      {
        id: 'user-admin',
        username: 'admin',
        email: 'admin@thanox.vn',
        password: 'Admin@123456',
        role: 'admin',
        balance: 5000000,
        totalSpent: 0,
        totalOrders: 0,
        status: 'active',
        createdAt: '2026-01-01',
        refCode: 'ADMINVIP',
        sellerStatus: 'active',
      }
    ],
    products: [
      {
        id: 'prod-1',
        name: 'Thanox Pro Android - Gói Vĩnh Viễn Tối Ưu',
        category: 'File Android',
        price: 99000,
        originalPrice: 150000,
        sellerPrice: 65000,
        soldCount: 42,
        stock: 'unlimited',
        status: 'active',
        featured: true,
        rating: 5.0,
        reviewCount: 28,
        description: 'File tối ưu hóa Android chuyên sâu, tăng 60-120 FPS, giảm giật lag và tối ưu pin cực đỉnh.',
        downloadLinkOrKeys: 'https://drive.google.com/file/d/thanox-pro-android-v2.5/view?usp=sharing\nKey Kích Hoạt: TX-PRO-AND-889922',
        updatedAt: '2026-01-01'
      },
      {
        id: 'prod-2',
        name: 'Module Magisk Thanox Kernel Extreme',
        category: 'File Android',
        price: 49000,
        originalPrice: 80000,
        sellerPrice: 30000,
        soldCount: 35,
        stock: 'unlimited',
        status: 'active',
        featured: false,
        rating: 4.9,
        reviewCount: 19,
        description: 'Module tối ưu xung nhịp CPU/GPU qua Magisk & KernelSU, mở khóa 120 FPS mọi tựa game.',
        downloadLinkOrKeys: 'https://drive.google.com/file/d/magisk-thanox-kernel/view?usp=sharing',
        updatedAt: '2026-01-01'
      },
      {
        id: 'prod-3',
        name: 'Chứng Chỉ iOS Thanox VIP - Ký App Trọn Đời',
        category: 'File iOS',
        price: 199000,
        originalPrice: 300000,
        sellerPrice: 140000,
        soldCount: 18,
        stock: 'unlimited',
        status: 'active',
        featured: true,
        rating: 5.0,
        reviewCount: 12,
        description: 'Chứng chỉ Certificate P12 + MobileProvision cài IPA không thu hồi, bảo hành 1 năm 1 đổi 1.',
        downloadLinkOrKeys: 'https://drive.google.com/file/d/ios-cert-p12-vip/view?usp=sharing\nPass: Thanox2026',
        updatedAt: '2026-01-01'
      },
      {
        id: 'prod-4',
        name: 'Menu Free Fire VIP - Antiban 100% An Toàn',
        category: 'Menu FF',
        price: 79000,
        originalPrice: 120000,
        sellerPrice: 50000,
        soldCount: 56,
        stock: 'unlimited',
        status: 'active',
        featured: true,
        rating: 4.8,
        reviewCount: 34,
        description: 'Menu hỗ trợ kéo tâm mượt mà, định vị địch chuẩn xác, bypass chống khóa nick rank cao.',
        downloadLinkOrKeys: 'Key: FF-VIP-30D-998877\nLink Tải Menu: https://drive.google.com/file/d/menu-ff-v2/view',
        updatedAt: '2026-01-01'
      },
      {
        id: 'prod-5',
        name: 'Key Bản Quyền Thanox Tool 30 Ngày',
        category: 'Key VIP',
        price: 50000,
        originalPrice: 80000,
        sellerPrice: 35000,
        soldCount: 88,
        stock: 'unlimited',
        status: 'active',
        featured: false,
        rating: 5.0,
        reviewCount: 45,
        description: 'Key kích hoạt full tính năng Thanox App trong 30 ngày, tự động kích hoạt ngay sau thanh toán.',
        downloadLinkOrKeys: 'THAN-OX-30D-AUTO-KEY-VALID',
        updatedAt: '2026-01-01'
      },
      {
        id: 'prod-6',
        name: 'Proxy IPv4 Riêng Biệt Tốc Độ Cao 1Gbps',
        category: 'Proxy Riêng',
        price: 35000,
        originalPrice: 60000,
        sellerPrice: 20000,
        soldCount: 22,
        stock: 'unlimited',
        status: 'active',
        featured: false,
        rating: 4.9,
        reviewCount: 15,
        description: 'Proxy sạch tĩnh Việt Nam (Viettel/FPT), ping 1ms, không giới hạn băng thông.',
        downloadLinkOrKeys: 'IP: 103.149.28.115:8080:thanox:proxyvip2026',
        updatedAt: '2026-01-01'
      }
    ],
    categories: [
      { id: 'cat-1', name: 'File Android', slug: 'file-android', icon: '🤖', count: 2, status: 'active', sortOrder: 1 },
      { id: 'cat-2', name: 'File iOS', slug: 'file-ios', icon: '🍎', count: 1, status: 'active', sortOrder: 2 },
      { id: 'cat-3', name: 'Menu FF', slug: 'menu-ff', icon: '🎯', count: 1, status: 'active', sortOrder: 3 },
      { id: 'cat-4', name: 'Key VIP', slug: 'key-vip', icon: '🔑', count: 1, status: 'active', sortOrder: 4 },
      { id: 'cat-5', name: 'Proxy Riêng', slug: 'proxy-rieng', icon: '🌐', count: 1, status: 'active', sortOrder: 5 },
      { id: 'cat-6', name: 'Tài Khoản Game', slug: 'tai-khoan-game', icon: '🎮', count: 0, status: 'active', sortOrder: 6 }
    ],
    orders: [],
    topups: [],
    cardRecharges: [],
    transactions: [],
    affiliates: [],
    affiliateRewards: [],
    tickets: [],
    settings: {
      shopName: 'THANOX STORE',
      shopSlogan: 'Hệ Thống Tối Ưu Game & Key Bản Quyền Số 1 VN',
      logoUrl: '',
      bankEnabled: true,
      bankName: 'MBBank (Quân Đội)',
      bankCode: 'MB',
      bankAccount: '0326884292',
      accountHolder: 'TRAN QUANG THANH',
      transferPrefix: 'NAP',
      qrTemplate: 'compact2',
      telegramBotToken: '',
      telegramAdminId: 'quangthank',
      telegramLink: '@quangthank',
      zaloHotline: '0916396901',
      maintenanceMode: false,
      autoApprovalEnabled: true,
      announcementEnabled: true,
      announcementText: '⚡ Nạp ví tự động qua VietQR 24/7. Giao key tức thì trong 3 giây.',
      announcementBar: {
        enabled: true,
        text: '⚡ Nạp ví tự động qua VietQR 24/7. Giao key tức thì trong 3 giây.',
        linkText: 'Nạp ngay',
        linkUrl: '/account/wallet/deposit'
      },
      theme: 'dark',
      primaryColor: '#7C3AED',
      accentColor: '#06B6D4',
      surfaceColor: '#0F0F1A',
      backgroundColor: '#08080F',
      enable2FA: false,
      rateLimiting: true,
      adminLogs: true,
      sessionTimeoutMinutes: 1440,
      affiliateEnabled: true,
      affiliateCommissionRate: 5,
      affiliateMinWithdraw: 50000,
      affiliateMinimumOrderValue: 200000,
      affiliateDefaultReward: 10000,
      affiliateDailyCap: 500000,
      affiliateHigherTierEnabled: false,
      affiliateHigherTierThreshold: 300000,
      affiliateHigherTierReward: 30000,
      musicEnabled: true,
      musicTracks: [
        {
          id: 'track-1',
          title: 'Cyberpunk Phonk VIP 2026',
          artist: 'Thanox Gaming Audio',
          url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=cyberpunk-2099-10701.mp3'
        },
        {
          id: 'track-2',
          title: 'Future Neon Drift',
          artist: 'Thanox Records',
          url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3'
        }
      ],
      effects: {
        snow: false,
        cherryBlossom: false,
        fireflies: false,
        cyberpunkGlow: true
      },
      minDeposit: 10000,
      maxDeposit: 10000000,
      scratchCardEnabled: true,
      cardSettings: {
        enabled: true,
        feePercentage: 15,
        allowedNetworks: ['Viettel', 'Vinaphone', 'Mobifone', 'Vietnamobile', 'Zing', 'Garena'],
        minAmount: 10000,
        maxAmount: 1000000
      }
    }
  };
};

// Read Database Helper
function readDB() {
  try {
    if (!fs.existsSync(dbFile)) {
      const initial = getInitialDB();
      fs.writeFileSync(dbFile, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const data = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return getInitialDB();
  }
}

// Write Database Helper
function writeDB(data) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ================= API ROUTES =================

// 1. Get entire store state for real-time sync across devices
app.get('/api/sync', (req, res) => {
  const db = readDB();
  res.json({ success: true, data: db });
});

// 2. Sync full state from Client (Admin update or client action)
app.post('/api/sync', (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }
    const current = readDB();
    const updated = {
      ...current,
      ...incoming,
      users: incoming.users || current.users,
      products: incoming.products || current.products,
      orders: incoming.orders || current.orders,
      topups: incoming.topups || current.topups,
      cardRecharges: incoming.cardRecharges || current.cardRecharges,
      transactions: incoming.transactions || current.transactions,
      settings: incoming.settings ? { ...current.settings, ...incoming.settings } : current.settings
    };
    writeDB(updated);
    res.json({ success: true, message: 'Synchronized successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Register a new user
app.post('/api/register', (req, res) => {
  try {
    const { username, email, password, refCode } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin đăng ký' });
    }
    const db = readDB();
    const cleanUser = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (db.users.some(u => u.username?.toLowerCase() === cleanUser)) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
    }
    if (db.users.some(u => u.email?.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Email đã được đăng ký' });
    }

    const newUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username: username.trim(),
      email: email.trim(),
      password: password,
      role: 'user',
      balance: 0,
      totalSpent: 0,
      totalOrders: 0,
      status: 'active',
      createdAt: new Date().toISOString().substring(0, 10),
      refCode: `REF${Math.floor(100000 + Math.random() * 900000)}`,
      referredBy: refCode || undefined,
      sellerStatus: 'none'
    };

    db.users.push(newUser);
    writeDB(db);
    res.json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Login
app.post('/api/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    const db = readDB();
    const cleanId = (identifier || '').trim().toLowerCase();

    const user = db.users.find(
      u => (u.username?.toLowerCase() === cleanId || u.email?.toLowerCase() === cleanId) && u.password === password
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác' });
    }
    if (user.status === 'banned') {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị tạm khóa' });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Submit Topup Request (VietQR)
app.post('/api/topups', (req, res) => {
  try {
    const topup = req.body;
    const db = readDB();
    db.topups.unshift(topup);
    writeDB(db);
    res.json({ success: true, topup });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Submit Card Recharge Request
app.post('/api/card-recharges', (req, res) => {
  try {
    const card = req.body;
    const db = readDB();
    db.cardRecharges.unshift(card);
    writeDB(db);
    res.json({ success: true, card });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Create Order
app.post('/api/orders', (req, res) => {
  try {
    const order = req.body;
    const db = readDB();
    db.orders.unshift(order);
    writeDB(db);
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= STATIC FILES & SPA FALLBACK =================

// Serve built frontend assets
app.use(express.static(distPath, {
  maxAge: '1h',
  etag: true,
}));

// Fallback to index.html for React Router SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Thanox Server & Realtime API] Running on http://localhost:${PORT} and http://127.0.0.1:${PORT}`);
});
