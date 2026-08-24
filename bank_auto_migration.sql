-- ============================================================================
-- BANK AUTO MIGRATION — TỰ ĐỘNG HÓA NẠP TIỀN QUA THUEAPIBANK (MB BANK)
-- Deploy: Supabase Dashboard → SQL Editor → Dán toàn bộ & Bấm RUN
-- ============================================================================
-- Các điểm khắc phục & tối ưu:
--   1. CRITICAL: Chuyển toàn bộ truy vấn từ public.users → public.profiles
--   2. Atomic Column Arithmetic: balance = COALESCE(balance, 0) + p_amount RETURNING
--   3. Topup Matching: Khớp chính xác transfer_note hoặc request_code (≥ 4 ký tự)
--   4. RLS & DDL Safety: Cấp quyền INSERT/SELECT topup cho Authenticated User,
--      tự động sinh ID và request_code tránh lỗi NOT NULL constraint.
--   5. Ghi sổ Ledger: Sinh UUID và tx_code '#GD-xxxxx' đồng bộ với toàn hệ thống.
--   6. Bảo mật RPC: REVOKE anon/authenticated, chỉ cho phép service_role gọi.
-- ============================================================================

-- ─── BƯỚC 1: DDL & BẢNG BANK_TRANSACTIONS ───
CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    provider_transaction_id TEXT NOT NULL,
    amount BIGINT NOT NULL,
    content TEXT,
    transfer_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending',
    matched_topup_id TEXT,
    matched_user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(provider, provider_transaction_id)
);

-- Thêm cột bank_transaction_id vào bảng topups (nếu chưa có)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'topups'
          AND column_name = 'bank_transaction_id'
    ) THEN
        ALTER TABLE public.topups
        ADD COLUMN bank_transaction_id UUID REFERENCES public.bank_transactions(id);
    END IF;
END $$;

-- Thêm cột matched_topup_id, matched_user_id vào bank_transactions (nếu chưa có)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bank_transactions'
          AND column_name = 'matched_topup_id'
    ) THEN
        ALTER TABLE public.bank_transactions ADD COLUMN matched_topup_id TEXT;
        ALTER TABLE public.bank_transactions ADD COLUMN matched_user_id TEXT;
    END IF;
END $$;

-- Đặt giá trị mặc định an toàn cho bảng topups (tránh lỗi NOT NULL khi Client insert)
DO $$
BEGIN
    ALTER TABLE public.topups ALTER COLUMN id SET DEFAULT ('topup-' || gen_random_uuid()::text);
    ALTER TABLE public.topups ALTER COLUMN request_code SET DEFAULT ('NAP-' || upper(substr(md5(random()::text), 1, 8)));
    ALTER TABLE public.topups ALTER COLUMN status SET DEFAULT 'pending';
    ALTER TABLE public.topups ALTER COLUMN created_at SET DEFAULT TIMEZONE('utc', NOW());
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ─── BƯỚC 2: PHÂN QUYỀN RLS BẢNG TOPUPS CHO NGƯỜI DÙNG ───
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

-- ─── BƯỚC 3: STORED PROCEDURE PROCESS_BANK_WEBHOOK (CHÍNH THỨC) ───
DROP FUNCTION IF EXISTS public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS public.process_bank_webhook(TEXT, TEXT, NUMERIC, TEXT, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.process_bank_webhook(TEXT, TEXT, NUMERIC, TEXT, TEXT);

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
    v_topup_id TEXT;
    v_user_id TEXT;
    v_user_name TEXT;
    v_expected_amount BIGINT;
    v_topup_status TEXT;
    v_bank_tx_id UUID;
    v_new_balance BIGINT;
    v_tx_id TEXT;
    v_tx_code TEXT;
BEGIN
    -- ============================================================
    -- 1. Idempotency: Ghi nhận giao dịch bank, chống trùng lặp tuyệt đối
    -- ============================================================
    BEGIN
        INSERT INTO public.bank_transactions (
            provider, provider_transaction_id, amount, content, transfer_time, status
        ) VALUES (
            p_provider, p_transaction_id, p_amount, p_content, p_transfer_time, 'pending'
        ) RETURNING id INTO v_bank_tx_id;
    EXCEPTION WHEN unique_violation THEN
        -- Giao dịch đã xử lý trước đó → bỏ qua ngay lập tức
        RETURN jsonb_build_object(
            'status', 'ignored',
            'reason', 'duplicate_transaction',
            'provider_tx_id', p_transaction_id
        );
    END;

    -- ============================================================
    -- 2. Khóa dòng Topup (SELECT ... FOR UPDATE SKIP LOCKED)
    --    Tìm đơn nạp pending khớp transfer_note hoặc request_code
    -- ============================================================
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

    -- Không tìm thấy yêu cầu nạp khớp
    IF v_topup_id IS NULL THEN
        UPDATE public.bank_transactions
        SET status = 'manual_review'
        WHERE id = v_bank_tx_id;

        RETURN jsonb_build_object(
            'status', 'manual_review',
            'reason', 'topup_request_not_found',
            'content', left(p_content, 100)
        );
    END IF;

    -- ============================================================
    -- 3. Kiểm tra số tiền chuyển khớp với số tiền yêu cầu
    -- ============================================================
    IF v_expected_amount != p_amount THEN
        UPDATE public.bank_transactions
        SET status = 'manual_review',
            matched_topup_id = v_topup_id,
            matched_user_id = v_user_id
        WHERE id = v_bank_tx_id;

        RETURN jsonb_build_object(
            'status', 'manual_review',
            'reason', 'amount_mismatch',
            'expected', v_expected_amount,
            'received', p_amount,
            'topup_id', v_topup_id
        );
    END IF;

    -- ============================================================
    -- 4. Cộng tiền vào ví tài khoản PROFILES (Atomic Column Arithmetic)
    -- ============================================================
    UPDATE public.profiles
    SET balance = COALESCE(balance, 0) + p_amount
    WHERE id::text = v_user_id
    RETURNING balance INTO v_new_balance;

    -- Cập nhật bảng legacy users nếu có
    BEGIN
      UPDATE public.users
      SET balance = COALESCE(balance, 0) + p_amount
      WHERE id::text = v_user_id;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Kiểm tra nếu profile không tìm thấy
    IF v_new_balance IS NULL THEN
        UPDATE public.bank_transactions
        SET status = 'manual_review',
            matched_topup_id = v_topup_id,
            matched_user_id = v_user_id
        WHERE id = v_bank_tx_id;

        RETURN jsonb_build_object(
            'status', 'manual_review',
            'reason', 'user_not_found_in_profiles',
            'user_id', v_user_id
        );
    END IF;

    -- ============================================================
    -- 5. Cập nhật trạng thái Topup -> approved
    -- ============================================================
    UPDATE public.topups
    SET status = 'approved',
        bank_transaction_id = v_bank_tx_id
    WHERE id = v_topup_id;

    -- ============================================================
    -- 6. Ghi sổ lịch sử giao dịch TRANSACTIONS
    -- ============================================================
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
        'Nạp tự động qua ' || p_provider || ' (Mã GD: ' || p_transaction_id || ')',
        p_amount,
        v_new_balance,
        'completed',
        now()
    );

    -- ============================================================
    -- 7. Đánh dấu Bank Transaction hoàn tất (processed)
    -- ============================================================
    UPDATE public.bank_transactions
    SET status = 'processed',
        matched_topup_id = v_topup_id,
        matched_user_id = v_user_id
    WHERE id = v_bank_tx_id;

    -- ============================================================
    -- 8. Phản hồi JSON kết quả thành công
    -- ============================================================
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

-- ─── BƯỚC 4: BẢO MẬT & PHÂN QUYỀN HÀM RPC ───
REVOKE ALL ON FUNCTION public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TIMESTAMP WITH TIME ZONE) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TIMESTAMP WITH TIME ZONE) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TIMESTAMP WITH TIME ZONE) TO service_role;
