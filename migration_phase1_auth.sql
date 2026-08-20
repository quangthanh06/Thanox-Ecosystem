-- ==============================================================================
-- PHASE 1: PREPARE AUTH & PROFILES SCHEMA
-- Vui lòng ch?y toàn b? l?nh này trong Supabase SQL Editor.
-- ==============================================================================

-- 1. Backup b?ng users cu thành users_legacy
ALTER TABLE IF EXISTS public.users RENAME TO users_legacy;

-- 2. T?o b?ng profiles m?i, liên k?t ch?t ch? v?i auth.users c?a Supabase
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user',
    balance BIGINT DEFAULT 0,
    total_spent BIGINT DEFAULT 0,
    status TEXT DEFAULT 'active',
    seller_status TEXT,
    seller_note TEXT,
    seller_applied_at TIMESTAMP WITH TIME ZONE,
    seller_approved_at TIMESTAMP WITH TIME ZONE,
    referred_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. T?o Trigger: T? d?ng t?o Profile khi có User m?i dang ký qua Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS \$\$
BEGIN
  INSERT INTO public.profiles (id, email, username, role, balance)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'user',
    0
  );
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;

-- G?n trigger vào auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. B?t Row Level Security (RLS) cho b?ng profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Policies cho b?ng profiles
-- a. Ai cung có th? xem profile public (d? l?y username, v.v.)
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

-- b. User ch? có th? t? c?p nh?t m?t s? thông tin c?a chính mình (nhung KHÔNG PH?I BALANCE)
CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
  
-- LUU Ý: V? sau, Admin s? c?n quy?n d? update m?i profiles.
-- Chúng ta s? thi?t l?p Role-based access control (RBAC) sau. T?m th?i Vercel API (Service Role) s? bypass RLS.

-- ==============================================================================
-- 6. C?P NH?T CÁC STORED PROCEDURES (RPC) Ð? DÙNG B?NG profiles THAY CHO users
-- ==============================================================================

CREATE OR REPLACE FUNCTION process_bank_webhook(
  p_provider TEXT,
  p_transaction_id TEXT,
  p_amount BIGINT,
  p_transfer_note TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS \$\$
DECLARE
    v_topup_id UUID;
    v_user_id UUID;
    v_current_balance BIGINT;
    v_new_balance BIGINT;
    v_transaction_record UUID;
BEGIN
    -- 1. Idempotency: Kiem tra giao dich ngan hang da ton tai chua
    IF EXISTS (SELECT 1 FROM public.bank_transactions WHERE transaction_id = p_transaction_id) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Transaction already processed');
    END IF;

    -- 2. Ghi nhan log ngan hang (De doi soat)
    INSERT INTO public.bank_transactions (provider, transaction_id, amount, transfer_note)
    VALUES (p_provider, p_transaction_id, p_amount, p_transfer_note)
    RETURNING id INTO v_transaction_record;

    -- 3. Match voi Topup Request (Tim pending topup request khop voi transfer_note)
    SELECT id, user_id INTO v_topup_id, v_user_id
    FROM public.topups
    WHERE status = 'pending' 
      AND p_transfer_note ILIKE '%' || transfer_note || '%'
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- Neu khong tim thay matching request, danh dau 'unmatched' roi thoat
    IF v_topup_id IS NULL THEN
        UPDATE public.bank_transactions 
        SET status = 'unmatched' 
        WHERE id = v_transaction_record;
        
        RETURN jsonb_build_object('success', true, 'message', 'Bank log saved, but no matching topup found');
    END IF;

    -- 4. Khoa dong User & Cap nhat so du (DUNG PROFILES)
    SELECT balance INTO v_current_balance 
    FROM public.profiles 
    WHERE id = v_user_id 
    FOR UPDATE;

    v_new_balance := COALESCE(v_current_balance, 0) + p_amount;

    UPDATE public.profiles 
    SET balance = v_new_balance 
    WHERE id = v_user_id;

    -- 5. Cap nhat Topup status
    UPDATE public.topups 
    SET status = 'approved', processed_at = NOW()
    WHERE id = v_topup_id;

    -- 6. Ghi log Transactions cho he thong
    INSERT INTO public.transactions (tx_code, type, user_id, amount, balance_after, description, status)
    VALUES (
        '#GD-' || floor(random() * 90000 + 10000)::text,
        'deposit',
        v_user_id,
        p_amount,
        v_new_balance,
        'N?p ti?n t? d?ng ' || p_provider || ' (Bank Tx: ' || p_transaction_id || ')',
        'completed'
    );

    UPDATE public.bank_transactions 
    SET status = 'matched' 
    WHERE id = v_transaction_record;

    RETURN jsonb_build_object('success', true, 'message', 'Topup approved successfully', 'user_id', v_user_id, 'new_balance', v_new_balance);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
\$\$;


CREATE OR REPLACE FUNCTION admin_approve_topup(
  p_topup_id UUID,
  p_admin_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS \$\$
DECLARE
    v_user_id UUID;
    v_amount BIGINT;
    v_current_balance BIGINT;
    v_new_balance BIGINT;
BEGIN
    -- 1. Lock dong topup de tranh race condition
    SELECT user_id, amount INTO v_user_id, v_amount
    FROM public.topups
    WHERE id = p_topup_id AND status = 'pending'
    FOR UPDATE;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Topup not found or already processed');
    END IF;

    -- 2. Lock dong user de cong tien an toan (DUNG PROFILES)
    SELECT balance INTO v_current_balance
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    v_new_balance := COALESCE(v_current_balance, 0) + v_amount;

    UPDATE public.profiles
    SET balance = v_new_balance
    WHERE id = v_user_id;

    -- 3. Cap nhat status topup
    UPDATE public.topups
    SET status = 'approved', processed_at = NOW()
    WHERE id = p_topup_id;

    -- 4. Ghi log transaction
    INSERT INTO public.transactions (tx_code, type, user_id, amount, balance_after, description, status)
    VALUES (
        '#GD-' || floor(random() * 90000 + 10000)::text,
        'deposit',
        v_user_id,
        v_amount,
        v_new_balance,
        'N?p ti?n th? công (Ðu?c duy?t b?i Admin)',
        'completed'
    );

    RETURN jsonb_build_object('success', true, 'message', 'Manual topup approved', 'user_id', v_user_id, 'new_balance', v_new_balance);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
\$\$;
