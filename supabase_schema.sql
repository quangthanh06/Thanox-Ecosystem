-- Tạo bảng Users (Khách hàng & Admin)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Sẽ được mã hóa sau
    role TEXT DEFAULT 'user', -- 'user' hoặc 'admin'
    balance BIGINT DEFAULT 0,
    total_spent BIGINT DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tạo bảng Products (Sản phẩm)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price BIGINT NOT NULL,
    seller_price BIGINT NOT NULL,
    original_price BIGINT,
    stock TEXT DEFAULT 'unlimited',
    status TEXT DEFAULT 'active',
    description TEXT,
    image_url TEXT,
    -- Cột này CỰC KỲ QUAN TRỌNG: Sẽ được bảo mật, không gửi xuống frontend nếu chưa mua
    hidden_keys_or_links TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tạo bảng Orders (Đơn hàng)
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    product_id UUID REFERENCES public.products(id),
    amount BIGINT NOT NULL,
    status TEXT DEFAULT 'completed',
    delivered_key TEXT, -- Chứa 1 dòng key hoặc link duy nhất giao cho khách
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tạo bảng Topups (Lịch sử nạp tiền)
CREATE TABLE public.topups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    amount BIGINT NOT NULL,
    reference_code TEXT UNIQUE NOT NULL, -- Mã chuyển khoản (VD: NAP 123456)
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tạo bảng Settings (Cài đặt hệ thống)
CREATE TABLE public.settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- CHÍNH SÁCH BẢO MẬT (Row Level Security - RLS)
-- 1. Bảo vệ cột hidden_keys_or_links của Products
-- (Chỉ Admin mới có quyền xem toàn bộ, khách hàng chỉ thấy sau khi API duyệt đơn)
