-- ============================================================================
-- SEPAY PRODUCTION HARDENED BANK MIGRATION
-- Thanox Ecosystem - Atomic, Idempotent, Fail-Closed Bank Auto Credit System
-- Deploy: Supabase Dashboard -> SQL Editor -> Dán toàn bộ & Bấm RUN
-- ============================================================================

-- ============================================================================
-- 1. DDL & BẢNG BANK_TRANSACTIONS (Lưu vết & Chống trùng lặp tuyệt đối)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'sepay',
    provider_transaction_id TEXT NOT NULL,
    amount BIGINT NOT NULL,
    content TEXT,
    transfer_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'manual_review', 'ignored'
    matched_topup_id TEXT,
    matched_user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(provider, provider_transaction_id)
);

-- Đảm bảo bảng topups có các cột cần thiết
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'topups' AND column_name = 'bank_transaction_id'
    ) THEN
        ALTER TABLE public.topups ADD COLUMN bank_transaction_id UUID REFERENCES public.bank_transactions(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'topups' AND column_name = 'transfer_note'
    ) THEN
        ALTER TABLE public.topups ADD COLUMN transfer_note TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'topups' AND column_name = 'request_code'
    ) THEN
        ALTER TABLE public.topups ADD COLUMN request_code TEXT;
    END IF;
END $$;

-- Đặt giá trị mặc định an toàn cho bảng topups
DO $$
BEGIN
    ALTER TABLE public.topups ALTER COLUMN id SET DEFAULT ('topup-' || gen_random_uuid()::text);
    ALTER TABLE public.topups ALTER COLUMN request_code SET DEFAULT ('NAP-' || upper(substr(md5(random()::text), 1, 8)));
    ALTER TABLE public.topups ALTER COLUMN status SET DEFAULT 'pending';
    ALTER TABLE public.topups ALTER COLUMN created_at SET DEFAULT TIMEZONE('utc', NOW());
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Tạo Indexes tối ưu tốc độ tra cứu và đối soát
CREATE INDEX IF NOT EXISTS idx_bank_transactions_provider_tx
ON public.bank_transactions (provider, provider_transaction_id);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_unmatched
ON public.bank_transactions (status, amount)
WHERE status = 'manual_review' AND matched_topup_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_topups_pending_lookup
ON public.topups (status, created_at DESC)
WHERE status = 'pending';

-- ============================================================================
-- 2. PHÂN QUYỀN ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.topups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "topups_select_owner" ON public.topups;
CREATE POLICY "topups_select_owner" ON public.topups
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "topups_insert_own" ON public.topups;
CREATE POLICY "topups_insert_own" ON public.topups
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "topups_update_own_pending" ON public.topups;
CREATE POLICY "topups_update_own_pending" ON public.topups
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text AND status = 'pending')
  WITH CHECK (user_id = auth.uid()::text AND status = 'pending');

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bank_tx_admin_read" ON public.bank_transactions;
CREATE POLICY "bank_tx_admin_read" ON public.bank_transactions
  FOR SELECT TO service_role
  USING (true);

-- ============================================================================
-- 3. XÓA TẤT CẢ PHIÊN BẢN CŨ CỦA CÁC HÀM
-- ============================================================================
DROP FUNCTION IF EXISTS public._bank_match_and_credit(UUID, TEXT, TEXT, BIGINT, TEXT);
DROP FUNCTION IF EXISTS public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS public.process_bank_webhook(TEXT, TEXT, NUMERIC, TEXT, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.process_bank_webhook(TEXT, TEXT, NUMERIC, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.retry_bank_matching(TEXT);

-- ============================================================================
-- 4. HÀM NỘI BỘ: _bank_match_and_credit (Khóa dòng, So khớp, Cộng tiền Atomic)
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
    v_topup_status TEXT;
    v_new_balance BIGINT;
    v_tx_id TEXT;
    v_tx_code TEXT;
BEGIN
    -- 1. Tìm đơn topup pending khớp mã nội dung (transfer_note hoặc request_code)
    -- Sử dụng FOR UPDATE SKIP LOCKED để ngăn chặn Race Condition
    SELECT t.id, t.user_id, t.user_name, t.amount, t.status
    INTO v_topup_id, v_user_id, v_user_name, v_expected_amount, v_topup_status
    FROM public.topups t
    WHERE t.status = 'pending'
      AND (
          (
              t.transfer_note IS NOT NULL
              AND length(btrim(t.transfer_note)) >= 4
              AND p_content ILIKE '%' || btrim(t.transfer_note) || '%'
          )
          OR
          (
              t.request_code IS NOT NULL
              AND length(btrim(replace(t.request_code, '#', ''))) >= 4
              AND p_content ILIKE '%' || btrim(replace(t.request_code, '#', '')) || '%'
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
            'content', left(p_content, 100),
            'amount', p_amount
        );
    END IF;

    -- 2. Kiểm tra số tiền chuyển khớp tuyệt đối (Exact Match VND Integer)
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

    -- 3. Cộng tiền nguyên tử vào bảng profiles (Atomic Column Arithmetic)
    UPDATE public.profiles
    SET balance = COALESCE(balance, 0) + p_amount
    WHERE id::text = v_user_id
    RETURNING balance INTO v_new_balance;

    -- Đồng bộ bảng users legacy nếu tồn tại
    BEGIN
        UPDATE public.users
        SET balance = COALESCE(balance, 0) + p_amount
        WHERE id::text = v_user_id;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Kiểm tra nếu không tìm thấy profile tương ứng
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

    -- 4. Cập nhật trạng thái Topup -> approved
    UPDATE public.topups
    SET status = 'approved',
        bank_transaction_id = p_bank_tx_id
    WHERE id = v_topup_id;

    -- 5. Ghi sổ cái giao dịch transactions (Ledger)
    v_tx_id := 'tx-' || gen_random_uuid()::text;
    v_tx_code := '#GD-' || floor(10000 + random() * 90000)::text;

    INSERT INTO public.transactions (
        id, tx_code, type, user_id, user_name,
        description, amount, balance_after, status, created_at
    ) VALUES (
        v_tx_id,
        v_tx_code,
        'deposit',
        v_user_id,
        COALESCE(v_user_name, 'Khách hàng'),
        'Nạp tự động qua ' || p_provider || ' (Mã GD: ' || p_provider_tx_id || ')',
        p_amount,
        v_new_balance,
        'completed',
        NOW()
    );

    -- 6. Đánh dấu Bank Transaction đã hoàn tất (processed)
    UPDATE public.bank_transactions
    SET status = 'processed',
        matched_topup_id = v_topup_id,
        matched_user_id = v_user_id
    WHERE id = p_bank_tx_id;

    -- 7. Trả về kết quả thành công
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
-- 5. HÀM CHÍNH: process_bank_webhook (Idempotent Endpoint cho SePay)
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

    -- 1. Idempotency: Ghi nhận giao dịch ngân hàng, chống xử lý lặp lại
    BEGIN
        INSERT INTO public.bank_transactions (
            provider, provider_transaction_id, amount, content, transfer_time, status
        ) VALUES (
            p_provider, p_transaction_id, p_amount, p_content, p_transfer_time, 'pending'
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

    -- 2. Tiến hành so khớp và cộng tiền nguyên tử
    v_res := public._bank_match_and_credit(v_bank_tx_id, p_provider, p_transaction_id, p_amount, p_content);
    RETURN v_res;
END;
$$;

-- ============================================================================
-- 6. HÀM BỔ TRỢ: retry_bank_matching (Khớp bù khi user tạo đơn sau khi đã chuyển)
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
    SELECT id, user_id, amount, transfer_note, request_code, status
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
    SELECT id, provider, provider_transaction_id, amount, content
    INTO v_bank_tx
    FROM public.bank_transactions
    WHERE status = 'manual_review'
      AND matched_topup_id IS NULL
      AND amount = v_topup.amount
      AND (
          (
              v_topup.transfer_note IS NOT NULL
              AND length(btrim(v_topup.transfer_note)) >= 4
              AND content ILIKE '%' || btrim(v_topup.transfer_note) || '%'
          )
          OR
          (
              v_topup.request_code IS NOT NULL
              AND length(btrim(replace(v_topup.request_code, '#', ''))) >= 4
              AND content ILIKE '%' || btrim(replace(v_topup.request_code, '#', '')) || '%'
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
-- 7. BẢO MẬT & PHÂN QUYỀN (CHỈ SERVICE_ROLE ĐƯỢC THỰC THI)
-- ============================================================================
REVOKE ALL ON FUNCTION public._bank_match_and_credit(UUID, TEXT, TEXT, BIGINT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TIMESTAMP WITH TIME ZONE) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.retry_bank_matching(TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public._bank_match_and_credit(UUID, TEXT, TEXT, BIGINT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TIMESTAMP WITH TIME ZONE) TO service_role;
GRANT EXECUTE ON FUNCTION public.retry_bank_matching(TEXT) TO service_role;
