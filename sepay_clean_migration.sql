-- ============================================================================
-- SEPAY EXCLUSIVE MIGRATION — DỌN DẸP & CẤU HÌNH DUY NHẤT CHO SEPAY
-- ============================================================================

-- 1. Bảng lưu trữ giao dịch ngân hàng từ SePay
CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'sepay',
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

-- 2. Đảm bảo bảng topups có đầy đủ cột và mặc định an toàn
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
END $$;

-- Cấp quyền an toàn cho topups
GRANT SELECT, INSERT, UPDATE ON public.topups TO anon, authenticated, service_role;
GRANT SELECT ON public.bank_transactions TO authenticated, service_role;

-- 3. Xóa sạch mọi phiên bản hàm cũ
DROP FUNCTION IF EXISTS public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS public.process_bank_webhook(TEXT, TEXT, NUMERIC, TEXT, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.process_bank_webhook(TEXT, TEXT, NUMERIC, TEXT, TEXT);

-- 4. Tạo Stored Procedure CHUẨN XÁC DUY NHẤT cho SePay
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
    v_bank_tx_id UUID;
    v_new_balance BIGINT;
    v_tx_id TEXT;
    v_tx_code TEXT;
BEGIN
    -- A. Chống trùng lặp giao dịch SePay (Idempotent)
    BEGIN
        INSERT INTO public.bank_transactions (
            provider, provider_transaction_id, amount, content, transfer_time, status
        ) VALUES (
            p_provider, p_transaction_id, p_amount, p_content, p_transfer_time, 'pending'
        ) RETURNING id INTO v_bank_tx_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object(
            'status', 'ignored',
            'reason', 'duplicate_transaction',
            'provider_tx_id', p_transaction_id
        );
    END;

    -- B. Khóa và tìm yêu cầu nạp tiền pending khớp nội dung (transfer_note hoặc request_code)
    SELECT t.id, t.user_id, t.user_name, t.amount
    INTO v_topup_id, v_user_id, v_user_name, v_expected_amount
    FROM public.topups t
    WHERE t.status = 'pending'
      AND (
          (
              t.transfer_note IS NOT NULL
              AND length(btrim(t.transfer_note)) >= 3
              AND p_content ILIKE '%' || btrim(t.transfer_note) || '%'
          )
          OR
          (
              t.request_code IS NOT NULL
              AND length(btrim(replace(t.request_code, '#', ''))) >= 3
              AND p_content ILIKE '%' || btrim(replace(t.request_code, '#', '')) || '%'
          )
      )
    ORDER BY t.created_at DESC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- Không tìm thấy đơn nạp
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

    -- C. Kiểm tra số tiền chuyển khớp số tiền yêu cầu
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
            'received', p_amount
        );
    END IF;

    -- D. Cộng tiền trực tiếp vào tài khoản profiles
    UPDATE public.profiles
    SET balance = COALESCE(balance, 0) + p_amount
    WHERE id::text = v_user_id
    RETURNING balance INTO v_new_balance;

    -- Đồng bộ bảng users legacy nếu có
    BEGIN
      UPDATE public.users
      SET balance = COALESCE(balance, 0) + p_amount
      WHERE id::text = v_user_id;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- E. Đánh dấu đơn topup -> approved
    UPDATE public.topups
    SET status = 'approved',
        bank_transaction_id = v_bank_tx_id
    WHERE id = v_topup_id;

    -- F. Ghi lịch sử giao dịch transactions
    v_tx_id := 'tx-' || gen_random_uuid()::text;
    v_tx_code := '#GD-' || floor(10000 + random() * 90000)::text;

    INSERT INTO public.transactions (
        id, tx_code, type, user_id, user_name,
        description, amount, balance_after, status, created_at
    ) VALUES (
        v_tx_id, v_tx_code, 'deposit', v_user_id, COALESCE(v_user_name, 'Khách hàng'),
        'Nạp tự động SePay (' || p_provider || ' - Mã GD: ' || p_transaction_id || ')',
        p_amount, v_new_balance, 'completed', now()
    );

    -- G. Đánh dấu hoàn tất
    UPDATE public.bank_transactions
    SET status = 'processed',
        matched_topup_id = v_topup_id,
        matched_user_id = v_user_id
    WHERE id = v_bank_tx_id;

    RETURN jsonb_build_object(
        'status', 'success',
        'topup_id', v_topup_id,
        'user_id', v_user_id,
        'added_amount', p_amount,
        'new_balance', v_new_balance
    );
END;
$$;

-- 5. Cấp quyền thực thi bảo mật cho Service Role
REVOKE ALL ON FUNCTION public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TIMESTAMP WITH TIME ZONE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TIMESTAMP WITH TIME ZONE) TO service_role;
