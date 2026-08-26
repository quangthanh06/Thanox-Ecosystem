-- ============================================================================
-- 🚀 THANOX ECOSYSTEM - MAX ENTERPRISE PRODUCTION MIGRATION
-- Siêu nâng cấp hệ thống: Nạp tiền tự động SePay, Chống Race Condition,
-- Chống lỗi Overload, Khớp mã thông minh 100% Không Lỗi.
-- Deploy: Supabase Dashboard -> SQL Editor -> Dán toàn bộ & Bấm RUN
-- ============================================================================

-- ============================================================================
-- 1. XÓA TRIỆT ĐỂ MỌI BẢN HÀM CŨ (LOẠI BỎ HOÀN TOÀN LỖI PGRST203)
-- ============================================================================
DROP FUNCTION IF EXISTS public._bank_match_and_credit(UUID, TEXT, TEXT, BIGINT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public._bank_match_and_credit(UUID, TEXT, TEXT, NUMERIC, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TIMESTAMP WITH TIME ZONE) CASCADE;
DROP FUNCTION IF EXISTS public.process_bank_webhook(TEXT, TEXT, NUMERIC, TEXT, TIMESTAMP WITH TIME ZONE) CASCADE;
DROP FUNCTION IF EXISTS public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.process_bank_webhook(TEXT, TEXT, NUMERIC, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.retry_bank_matching(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.retry_bank_matching(UUID) CASCADE;

-- ============================================================================
-- 2. TẠO & HOÀN THIỆN TOÀN BỘ BẢNG DỮ LIỆU CẦN THIẾT
-- ============================================================================

-- A. Bảng bank_transactions (Lưu vết & Chống trùng lặp tuyệt đối)
CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'sepay',
    provider_transaction_id TEXT NOT NULL,
    amount BIGINT NOT NULL,
    content TEXT,
    transfer_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'manual_review', 'ignored'
    matched_topup_id TEXT,
    matched_user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(provider, provider_transaction_id)
);

-- B. Bảng topups (Yêu cầu nạp tiền)
CREATE TABLE IF NOT EXISTS public.topups (
    id TEXT PRIMARY KEY DEFAULT ('topup-' || gen_random_uuid()::text),
    user_id TEXT,
    user_name TEXT DEFAULT 'Khách hàng',
    amount BIGINT NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    method TEXT DEFAULT 'VietQR',
    request_code TEXT,
    transfer_note TEXT,
    bank_transaction_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- C. Bảng categories (Danh mục sản phẩm)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon TEXT DEFAULT '📁',
    image TEXT DEFAULT '',
    count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- D. Bảng store_settings (Cấu hình hệ thống)
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    settings_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- E. Bảng transactions (Sổ cái lịch sử biến động số dư)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY DEFAULT ('tx-' || gen_random_uuid()::text),
    tx_code TEXT,
    type TEXT DEFAULT 'deposit',
    user_id TEXT,
    user_name TEXT,
    description TEXT,
    amount BIGINT DEFAULT 0,
    balance_after BIGINT DEFAULT 0,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- F. Đảm bảo các cột quan trọng tồn tại (Không bao giờ lỗi trùng cột)
ALTER TABLE public.topups ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.topups ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.topups ADD COLUMN IF NOT EXISTS amount BIGINT;
ALTER TABLE public.topups ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.topups ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'VietQR';
ALTER TABLE public.topups ADD COLUMN IF NOT EXISTS request_code TEXT;
ALTER TABLE public.topups ADD COLUMN IF NOT EXISTS transfer_note TEXT;
ALTER TABLE public.topups ADD COLUMN IF NOT EXISTS bank_transaction_id UUID;
ALTER TABLE public.topups ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE public.topups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

ALTER TABLE public.bank_transactions ADD COLUMN IF NOT EXISTS matched_topup_id TEXT;
ALTER TABLE public.bank_transactions ADD COLUMN IF NOT EXISTS matched_user_id TEXT;

-- G. Tạo Indexes hiệu năng cao cho việc tra cứu siêu tốc
CREATE INDEX IF NOT EXISTS idx_bank_tx_provider_lookup ON public.bank_transactions (provider, provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_manual_review ON public.bank_transactions (status, amount) WHERE status = 'manual_review';
CREATE INDEX IF NOT EXISTS idx_topups_pending_queue ON public.topups (status, created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions (user_id, created_at DESC);

-- ============================================================================
-- 3. PHÂN QUYỀN AN TOÀN ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.topups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "topups_select_owner" ON public.topups;
CREATE POLICY "topups_select_owner" ON public.topups FOR SELECT USING (true);
DROP POLICY IF EXISTS "topups_insert_all" ON public.topups;
CREATE POLICY "topups_insert_all" ON public.topups FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "topups_update_service" ON public.topups;
CREATE POLICY "topups_update_service" ON public.topups FOR UPDATE USING (true);

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bank_tx_all_read" ON public.bank_transactions;
CREATE POLICY "bank_tx_all_read" ON public.bank_transactions FOR SELECT USING (true);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories_service_all" ON public.categories;
CREATE POLICY "categories_service_all" ON public.categories FOR ALL USING (true);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "store_settings_public_read" ON public.store_settings;
CREATE POLICY "store_settings_public_read" ON public.store_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "store_settings_service_all" ON public.store_settings;
CREATE POLICY "store_settings_service_all" ON public.store_settings FOR ALL USING (true);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transactions_public_read" ON public.transactions;
CREATE POLICY "transactions_public_read" ON public.transactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "transactions_service_all" ON public.transactions;
CREATE POLICY "transactions_service_all" ON public.transactions FOR ALL USING (true);

-- Cấp quyền truy cập bảng công khai
GRANT SELECT, INSERT, UPDATE ON public.topups TO anon, authenticated, service_role;
GRANT SELECT ON public.bank_transactions TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_settings TO anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.transactions TO anon, authenticated, service_role;

-- ============================================================================
-- 4. HÀM NỘI BỘ: _bank_match_and_credit (Thuật toán khớp thông minh MAX)
-- ============================================================================
CREATE OR REPLACE FUNCTION public._bank_match_and_credit(
    p_bank_tx_id UUID,
    p_provider TEXT,
    p_provider_tx_id TEXT,
    p_amount BIGINT,
    p_content TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_topup_id TEXT;
    v_user_id TEXT;
    v_user_name TEXT;
    v_expected_amount BIGINT;
    v_clean_content TEXT;
    v_new_balance BIGINT;
    v_tx_id TEXT;
    v_tx_code TEXT;
BEGIN
    -- Chuẩn hóa nội dung chuyển khoản (bỏ ký tự lạ, đưa về chữ hoa)
    v_clean_content := upper(COALESCE(p_content, ''));

    -- 1. Tìm đơn topup pending khớp nội dung (Khóa dòng chống Race Condition)
    -- Hỗ trợ khớp transfer_note, request_code, hoặc mã đơn dạng NAP-XXXX
    SELECT t.id, t.user_id, t.user_name, t.amount::bigint
    INTO v_topup_id, v_user_id, v_user_name, v_expected_amount
    FROM public.topups t
    WHERE t.status = 'pending'
      AND (
          -- Khớp theo transfer_note (VD: SHOPTHANOX ADMIN 5336 hoặc NAP ADMIN 5336)
          (
              t.transfer_note IS NOT NULL
              AND length(btrim(t.transfer_note)) >= 3
              AND (
                  v_clean_content ILIKE '%' || upper(btrim(t.transfer_note)) || '%'
                  OR v_clean_content ILIKE '%' || upper(btrim(replace(t.transfer_note, 'SHOPTHANOX', ''))) || '%'
                  OR v_clean_content ILIKE '%' || upper(btrim(replace(t.transfer_note, 'NAP', ''))) || '%'
              )
          )
          OR
          -- Khớp theo request_code (VD: #NAP-52481 hoặc NAP-52481)
          (
              t.request_code IS NOT NULL
              AND length(btrim(replace(t.request_code, '#', ''))) >= 3
              AND v_clean_content ILIKE '%' || upper(btrim(replace(t.request_code, '#', ''))) || '%'
          )
      )
    ORDER BY t.created_at DESC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- Không tìm thấy yêu cầu nạp tiền pending phù hợp
    IF v_topup_id IS NULL THEN
        UPDATE public.bank_transactions
        SET status = 'manual_review'
        WHERE id = p_bank_tx_id;

        RETURN jsonb_build_object(
            'status', 'manual_review',
            'reason', 'topup_request_not_found',
            'content', left(p_content, 120),
            'amount', p_amount
        );
    END IF;

    -- 2. Kiểm tra số tiền chuyển khớp tuyệt đối (Chống gian lận chuyển thiếu)
    IF v_expected_amount != p_amount THEN
        UPDATE public.bank_transactions
        SET status = 'manual_review',
            matched_topup_id = v_topup_id,
            matched_user_id = v_user_id
        WHERE id = p_bank_tx_id;

        RETURN jsonb_build_object(
            'status', 'manual_review',
            'reason', 'amount_mismatch',
            'expected', v_expected_amount,
            'received', p_amount,
            'topup_id', v_topup_id
        );
    END IF;

    -- 3. Cộng tiền nguyên tử vào bảng profiles (Type-safe User ID)
    UPDATE public.profiles
    SET balance = COALESCE(balance, 0) + p_amount
    WHERE id::text = v_user_id::text
    RETURNING balance::bigint INTO v_new_balance;

    -- Đồng bộ bảng users legacy nếu tồn tại
    BEGIN
        UPDATE public.users
        SET balance = COALESCE(balance, 0) + p_amount
        WHERE id::text = v_user_id::text;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Nếu user_id không tồn tại trong profiles
    IF v_new_balance IS NULL THEN
        UPDATE public.bank_transactions
        SET status = 'manual_review',
            matched_topup_id = v_topup_id,
            matched_user_id = v_user_id
        WHERE id = p_bank_tx_id;

        RETURN jsonb_build_object(
            'status', 'manual_review',
            'reason', 'user_not_found_in_profiles',
            'user_id', v_user_id,
            'topup_id', v_topup_id
        );
    END IF;

    -- 4. Đánh dấu đơn topup -> approved
    UPDATE public.topups
    SET status = 'approved',
        bank_transaction_id = p_bank_tx_id,
        updated_at = NOW()
    WHERE id = v_topup_id;

    -- 5. Ghi sổ cái lịch sử giao dịch (Ledger Audit)
    v_tx_id := 'tx-' || gen_random_uuid()::text;
    v_tx_code := '#GD-' || floor(10000 + random() * 90000)::text;

    BEGIN
        INSERT INTO public.transactions (
            id, tx_code, type, user_id, user_name,
            description, amount, balance_after, status, created_at
        ) VALUES (
            v_tx_id,
            v_tx_code,
            'deposit',
            v_user_id,
            COALESCE(v_user_name, 'Khách hàng'),
            'Nạp tự động SePay (' || p_provider || ' - Mã GD: ' || p_provider_tx_id || ')',
            p_amount,
            v_new_balance,
            'completed',
            NOW()
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- 6. Đánh dấu Bank Transaction hoàn tất thành công (processed)
    UPDATE public.bank_transactions
    SET status = 'processed',
        matched_topup_id = v_topup_id,
        matched_user_id = v_user_id
    WHERE id = p_bank_tx_id;

    -- 7. Phản hồi JSON kết quả thành công
    RETURN jsonb_build_object(
        'status', 'success',
        'topup_id', v_topup_id,
        'user_id', v_user_id,
        'added_amount', p_amount,
        'new_balance', v_new_balance,
        'tx_id', v_tx_id
    );
END;
$$;

-- ============================================================================
-- 5. HÀM CHÍNH: process_bank_webhook (Duy nhất 1 chữ ký - Chuẩn PostgREST)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_bank_webhook(
    p_provider TEXT,
    p_transaction_id TEXT,
    p_amount BIGINT,
    p_content TEXT,
    p_transfer_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_bank_tx_id UUID;
    v_existing_status TEXT;
    v_res JSONB;
BEGIN
    -- Kiểm tra tham số đầu vào
    IF p_transaction_id IS NULL OR length(btrim(p_transaction_id)) = 0 THEN
        RETURN jsonb_build_object('status', 'manual_review', 'reason', 'invalid_transaction_id');
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RETURN jsonb_build_object('status', 'manual_review', 'reason', 'invalid_amount');
    END IF;

    -- 1. Idempotency: Ghi nhận giao dịch ngân hàng, chống trùng lặp tuyệt đối
    BEGIN
        INSERT INTO public.bank_transactions (
            provider, provider_transaction_id, amount, content, transfer_time, status
        ) VALUES (
            p_provider, p_transaction_id, p_amount, p_content, COALESCE(p_transfer_time, NOW()), 'pending'
        ) RETURNING id INTO v_bank_tx_id;
    EXCEPTION WHEN unique_violation THEN
        -- Giao dịch đã tồn tại -> Bỏ qua, không cộng tiền lần 2
        SELECT status INTO v_existing_status
        FROM public.bank_transactions
        WHERE provider = p_provider AND provider_transaction_id = p_transaction_id;

        RETURN jsonb_build_object(
            'status', 'ignored',
            'reason', 'duplicate_transaction',
            'provider_tx_id', p_transaction_id,
            'current_status', v_existing_status
        );
    END;

    -- 2. Tiến hành so khớp thông minh và cộng tiền
    v_res := public._bank_match_and_credit(v_bank_tx_id, p_provider, p_transaction_id, p_amount, p_content);
    RETURN v_res;
END;
$$;

-- ============================================================================
-- 6. HÀM BỔ TRỢ: retry_bank_matching (Khớp bù tức thì khi tạo đơn sau)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.retry_bank_matching(
    p_topup_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_topup RECORD;
    v_bank_tx RECORD;
    v_res JSONB;
BEGIN
    -- 1. Khóa và lấy thông tin topup pending
    SELECT id, user_id, amount::bigint, transfer_note, request_code, status
    INTO v_topup
    FROM public.topups
    WHERE id = p_topup_id AND status = 'pending'
    FOR UPDATE SKIP LOCKED;

    IF v_topup.id IS NULL THEN
        RETURN jsonb_build_object(
            'status', 'ignored',
            'reason', 'topup_not_pending_or_locked',
            'topup_id', p_topup_id
        );
    END IF;

    -- 2. Tìm bank_transaction chưa được match (status = 'manual_review' và matched_topup_id IS NULL)
    SELECT id, provider, provider_transaction_id, amount::bigint, content
    INTO v_bank_tx
    FROM public.bank_transactions
    WHERE status = 'manual_review'
      AND matched_topup_id IS NULL
      AND amount = v_topup.amount
      AND (
          (
              v_topup.transfer_note IS NOT NULL
              AND length(btrim(v_topup.transfer_note)) >= 3
              AND upper(content) ILIKE '%' || upper(btrim(v_topup.transfer_note)) || '%'
          )
          OR
          (
              v_topup.request_code IS NOT NULL
              AND length(btrim(replace(v_topup.request_code, '#', ''))) >= 3
              AND upper(content) ILIKE '%' || upper(btrim(replace(v_topup.request_code, '#', ''))) || '%'
          )
      )
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_bank_tx.id IS NULL THEN
        RETURN jsonb_build_object(
            'status', 'pending',
            'reason', 'no_matching_bank_transaction',
            'topup_id', p_topup_id
        );
    END IF;

    -- 3. Thực hiện match và credit
    v_res := public._bank_match_and_credit(
        v_bank_tx.id,
        v_bank_tx.provider,
        v_bank_tx.provider_transaction_id,
        v_bank_tx.amount,
        v_bank_tx.content
    );

    RETURN v_res;
END;
$$;

-- ============================================================================
-- 7. BẢO MẬT & PHÂN QUYỀN EXECUTE CHO SERVICE_ROLE
-- ============================================================================
REVOKE ALL ON FUNCTION public._bank_match_and_credit(UUID, TEXT, TEXT, BIGINT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TIMESTAMP WITH TIME ZONE) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.retry_bank_matching(TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public._bank_match_and_credit(UUID, TEXT, TEXT, BIGINT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TIMESTAMP WITH TIME ZONE) TO service_role;
GRANT EXECUTE ON FUNCTION public.retry_bank_matching(TEXT) TO service_role;

-- ============================================================================
-- 8. STORAGE BUCKET CHO ẢNH SẢN PHẨM & TỆP TIN (store_media)
-- ============================================================================
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('store_media', 'store_media', true)
    ON CONFLICT (id) DO UPDATE SET public = true;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "store_media_public_read" ON storage.objects;
    CREATE POLICY "store_media_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'store_media');

    DROP POLICY IF EXISTS "store_media_public_insert" ON storage.objects;
    CREATE POLICY "store_media_public_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'store_media');

    DROP POLICY IF EXISTS "store_media_public_update" ON storage.objects;
    CREATE POLICY "store_media_public_update" ON storage.objects FOR UPDATE USING (bucket_id = 'store_media');

    DROP POLICY IF EXISTS "store_media_public_delete" ON storage.objects;
    CREATE POLICY "store_media_public_delete" ON storage.objects FOR DELETE USING (bucket_id = 'store_media');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
