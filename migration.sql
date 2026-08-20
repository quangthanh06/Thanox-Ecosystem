-- Xóa các b?ng cu d? t?o l?i v?i d?y d? c?t cho App (n?u chua có d? li?u quan tr?ng)
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.topups CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.card_recharges CASCADE;

-- T?o b?ng Orders (Ðon hàng) d?y d?
CREATE TABLE public.orders (
    id TEXT PRIMARY KEY,
    order_code TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_email TEXT,
    product_id TEXT NOT NULL,
    product_name TEXT,
    category TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price BIGINT NOT NULL,
    total_price BIGINT NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'completed',
    delivered_content TEXT,
    key TEXT,
    is_seller_order BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- T?o b?ng Topups (N?p ti?n Bank)
CREATE TABLE public.topups (
    id TEXT PRIMARY KEY,
    request_code TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT,
    amount BIGINT NOT NULL,
    method TEXT,
    transfer_note TEXT,
    proof_image TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- T?o b?ng Transactions (L?ch s? giao d?ch)
CREATE TABLE public.transactions (
    id TEXT PRIMARY KEY,
    tx_code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT,
    description TEXT,
    amount BIGINT NOT NULL,
    balance_after BIGINT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- T?o b?ng Card Recharges (N?p th? cào)
CREATE TABLE public.card_recharges (
    id TEXT PRIMARY KEY,
    request_code TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT,
    network TEXT NOT NULL,
    declared_amount BIGINT NOT NULL,
    serial TEXT NOT NULL,
    pin TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
