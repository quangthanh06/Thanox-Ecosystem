-- Hàm RPC (Stored Procedure) duy?t th? công (Dành cho Admin)
CREATE OR REPLACE FUNCTION admin_approve_topup(p_topup_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS \$\$
DECLARE
    v_user_id TEXT;
    v_user_name TEXT;
    v_expected_amount BIGINT;
    v_topup_status TEXT;
    v_method TEXT;
    v_transfer_note TEXT;
    v_current_balance BIGINT;
    v_new_balance BIGINT;
BEGIN
    -- 1. Khóa dòng Topup (Row-level Lock)
    SELECT user_id, user_name, amount, status, method, transfer_note 
    INTO v_user_id, v_user_name, v_expected_amount, v_topup_status, v_method, v_transfer_note
    FROM public.topups 
    WHERE id = p_topup_id 
    FOR UPDATE SKIP LOCKED;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('status', 'error', 'reason', 'topup_not_found');
    END IF;

    IF v_topup_status != 'pending' THEN
        RETURN jsonb_build_object('status', 'error', 'reason', 'topup_not_pending');
    END IF;

    -- 2. Khóa dòng User & C?p nh?t s? du
    SELECT balance INTO v_current_balance 
    FROM public.users 
    WHERE id = v_user_id 
    FOR UPDATE;

    v_new_balance := COALESCE(v_current_balance, 0) + v_expected_amount;

    UPDATE public.users 
    SET balance = v_new_balance 
    WHERE id = v_user_id;

    -- 3. C?p nh?t Topup status
    UPDATE public.topups 
    SET status = 'approved', 
        processed_at = now()
    WHERE id = p_topup_id;

    -- 4. Ghi Ledger (Transactions)
    INSERT INTO public.transactions (id, tx_code, type, user_id, user_name, description, amount, balance_after, status, created_at)
    VALUES (
        'tx-' || extract(epoch from now()) * 1000, 
        '#GD-' || floor(random() * 89999 + 10000)::text,
        'deposit',
        v_user_id,
        v_user_name,
        'Admin duy?t n?p ti?n qua ' || v_method || ' (' || v_transfer_note || ')',
        v_expected_amount,
        v_new_balance,
        'completed',
        now()
    );

    RETURN jsonb_build_object('status', 'success', 'added_amount', v_expected_amount);
END;
\$\$;
