-- 1. T?o b?ng Bank Transactions (Ch?ng trùng l?p và luu v?t)
CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL, 
    provider_transaction_id TEXT NOT NULL, 
    amount BIGINT NOT NULL,
    content TEXT,
    transfer_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(provider, provider_transaction_id) 
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
SECURITY DEFINER 
AS \$\$
DECLARE
    v_topup_id TEXT;
    v_user_id TEXT;
    v_user_name TEXT;
    v_expected_amount BIGINT;
    v_topup_status TEXT;
    v_current_balance BIGINT;
    v_bank_tx_id UUID;
    v_new_balance BIGINT;
BEGIN
    -- 1. Idempotency: Luu giao d?ch, b? qua n?u dã t?n t?i
    BEGIN
        INSERT INTO public.bank_transactions (provider, provider_transaction_id, amount, content, transfer_time, status)
        VALUES (p_provider, p_transaction_id, p_amount, p_content, p_transfer_time, 'pending')
        RETURNING id INTO v_bank_tx_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('status', 'ignored', 'reason', 'duplicate_transaction');
    END;

    -- 2 & 3. Khóa dòng Topup b?ng cách quét transfer_note HO?C request_code trong n?i dung CK
    SELECT id, user_id, user_name, amount, status 
    INTO v_topup_id, v_user_id, v_user_name, v_expected_amount, v_topup_status
    FROM public.topups 
    WHERE (
        p_content ILIKE '%' || transfer_note || '%' 
        OR p_content ILIKE '%' || replace(request_code, '#', '') || '%'
    )
    AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_topup_id IS NULL THEN
        UPDATE public.bank_transactions SET status = 'manual_review' WHERE id = v_bank_tx_id;
        RETURN jsonb_build_object('status', 'manual_review', 'reason', 'topup_request_not_found');
    END IF;

    IF v_expected_amount != p_amount THEN
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
        'N?p t? d?ng qua ' || p_provider || ' (Mã GD: ' || p_transaction_id || ')',
        p_amount,
        v_new_balance,
        'completed',
        now()
    );

    -- 7. Hoàn t?t Bank Transaction
    UPDATE public.bank_transactions SET status = 'processed' WHERE id = v_bank_tx_id;

    RETURN jsonb_build_object('status', 'success', 'topup_id', v_topup_id, 'added_amount', p_amount);
END;
\$\$;
