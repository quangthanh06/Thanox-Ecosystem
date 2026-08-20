-- 1. T?o b?ng Bank Transactions (Ch?ng trùng l?p và luu v?t)
CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL, -- 'sepay', 'casso', v.v.
    provider_transaction_id TEXT NOT NULL, -- ID duy nh?t t? provider
    amount BIGINT NOT NULL,
    content TEXT,
    transfer_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending', -- 'processed', 'manual_review', 'ignored'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(provider, provider_transaction_id) -- Ràng bu?c Idempotency c?c k? quan tr?ng
);

-- 2. Thêm c?t bank_transaction_id vào topups (n?u chua có)
DO \$\$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='topups' AND column_name='bank_transaction_id') THEN
        ALTER TABLE public.topups ADD COLUMN bank_transaction_id UUID REFERENCES public.bank_transactions(id);
    END IF;
END \$\$;

-- 3. T?o Hàm RPC (Stored Procedure) x? lý Giao d?ch Atomic
CREATE OR REPLACE FUNCTION process_bank_webhook(
    p_provider TEXT,
    p_transaction_id TEXT,
    p_amount BIGINT,
    p_content TEXT,
    p_transfer_time TIMESTAMP WITH TIME ZONE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Ch?y v?i quy?n admin d? bypass RLS
AS \$\$
DECLARE
    v_topup_id TEXT;
    v_user_id TEXT;
    v_user_name TEXT;
    v_expected_amount BIGINT;
    v_topup_status TEXT;
    v_current_balance BIGINT;
    v_bank_tx_id UUID;
    v_ref_code TEXT;
    v_new_balance BIGINT;
BEGIN
    -- 1. Idempotency: Luu giao d?ch, b? qua n?u dã t?n t?i
    BEGIN
        INSERT INTO public.bank_transactions (provider, provider_transaction_id, amount, content, transfer_time, status)
        VALUES (p_provider, p_transaction_id, p_amount, p_content, p_transfer_time, 'pending')
        RETURNING id INTO v_bank_tx_id;
    EXCEPTION WHEN unique_violation THEN
        -- Ðã x? lý r?i, an toàn tr? v?
        RETURN jsonb_build_object('status', 'ignored', 'reason', 'duplicate_transaction');
    END;

    -- 2. L?c mã n?p ti?n t? n?i dung (Gi? d?nh mã là NAP-XXXXX)
    -- Hàm regexp_match tr? v? m?ng, l?y ph?n t? d?u tiên
    v_ref_code := (regexp_match(upper(p_content), '#?NAP[- ]?([A-Z0-9]+)'))[1];
    
    IF v_ref_code IS NULL THEN
        -- Không tìm th?y mã n?p ti?n, dánh d?u ignored
        UPDATE public.bank_transactions SET status = 'ignored' WHERE id = v_bank_tx_id;
        RETURN jsonb_build_object('status', 'ignored', 'reason', 'no_reference_code_found');
    END IF;

    -- Re-construct exact ref code (e.g. #NAP-1234)
    v_ref_code := '#NAP-' || v_ref_code;

    -- 3. Khóa dòng Topup (Row-level Lock)
    SELECT id, user_id, user_name, amount, status 
    INTO v_topup_id, v_user_id, v_user_name, v_expected_amount, v_topup_status
    FROM public.topups 
    WHERE request_code = v_ref_code 
    FOR UPDATE SKIP LOCKED; -- Ngan race condition

    IF v_topup_id IS NULL THEN
        -- Mã có t?n t?i trong tin nh?n nhung không có trong Database -> Manual Review
        UPDATE public.bank_transactions SET status = 'manual_review' WHERE id = v_bank_tx_id;
        RETURN jsonb_build_object('status', 'manual_review', 'reason', 'topup_request_not_found');
    END IF;

    IF v_topup_status != 'pending' THEN
        -- Ðon n?p dã du?c x? lý (b?i admin ho?c webhook khác) -> Manual Review
        UPDATE public.bank_transactions SET status = 'manual_review' WHERE id = v_bank_tx_id;
        RETURN jsonb_build_object('status', 'manual_review', 'reason', 'topup_not_pending');
    END IF;

    IF v_expected_amount != p_amount THEN
        -- Sai l?ch s? ti?n -> Manual Review
        UPDATE public.bank_transactions SET status = 'manual_review' WHERE id = v_bank_tx_id;
        RETURN jsonb_build_object('status', 'manual_review', 'reason', 'amount_mismatch');
    END IF;

    -- 4. Khóa dòng User & C?p nh?t s? du
    SELECT balance INTO v_current_balance 
    FROM public.users 
    WHERE id = v_user_id 
    FOR UPDATE;

    v_new_balance := COALESCE(v_current_balance, 0) + p_amount;

    UPDATE public.users 
    SET balance = v_new_balance 
    WHERE id = v_user_id;

    -- 5. C?p nh?t Topup status
    UPDATE public.topups 
    SET status = 'approved', 
        bank_transaction_id = v_bank_tx_id 
    WHERE id = v_topup_id;

    -- 6. Ghi Ledger (Transactions)
    INSERT INTO public.transactions (id, tx_code, type, user_id, user_name, description, amount, balance_after, status, created_at)
    VALUES (
        'tx-' || extract(epoch from now()) * 1000, 
        '#GD-' || floor(random() * 89999 + 10000)::text,
        'deposit',
        v_user_id,
        v_user_name,
        'N?p ti?n t? d?ng qua ' || p_provider || ' (Mã GD: ' || p_transaction_id || ')',
        p_amount,
        v_new_balance,
        'completed',
        now()
    );

    -- 7. Hoàn t?t Bank Transaction
    UPDATE public.bank_transactions SET status = 'processed' WHERE id = v_bank_tx_id;

    -- T? d?ng Commit khi k?t thúc Function
    RETURN jsonb_build_object('status', 'success', 'topup_id', v_topup_id, 'added_amount', p_amount);
END;
\$\$;
