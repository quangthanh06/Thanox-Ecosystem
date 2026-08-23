-- ============================================================================
-- MỐC B EXTRAS — Admin tài chính an toàn: điều chỉnh số dư + hoàn tiền đơn
-- + dọn key sót trong settings + khóa bảng transactions
-- Idempotent — chạy sau moc_b_core.sql
-- ============================================================================

-- 1) RPC ADMIN ĐIỀU CHỈNH SỐ DƯ (có audit, khóa dòng, ledger append-only)
CREATE OR REPLACE FUNCTION public.admin_adjust_balance(
  p_user_id TEXT,
  p_amount  BIGINT,
  p_note    TEXT DEFAULT ''
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_admin RECORD; v_user RECORD; v_new BIGINT;
BEGIN
  SELECT * INTO v_admin FROM profiles WHERE id = auth.uid();
  IF NOT FOUND OR v_admin.role <> 'admin' THEN
    RETURN jsonb_build_object('status','error','code','FORBIDDEN');
  END IF;
  IF p_amount IS NULL OR p_amount = 0 THEN
    RETURN jsonb_build_object('status','error','code','INVALID_AMOUNT');
  END IF;

  SELECT * INTO v_user FROM profiles WHERE id::text = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','error','code','USER_NOT_FOUND'); END IF;

  v_new := GREATEST(COALESCE(v_user.balance,0) + p_amount, 0);
  UPDATE profiles SET balance = v_new WHERE id = v_user.id;

  INSERT INTO transactions (id, tx_code, type, user_id, user_name, description, amount, balance_after, status, created_at)
  VALUES ('tx-' || gen_random_uuid()::text,
          '#GD-' || upper(substr(md5(random()::text),1,8)),
          'adjustment',
          v_user.id::text, v_user.username,
          'Điều chỉnh bởi Admin ' || v_admin.username || ': ' || COALESCE(NULLIF(p_note,''),'Thao tác thủ công'),
          p_amount, v_new, 'completed', NOW());
  INSERT INTO audit_log (actor_id, action, target_type, target_id, detail)
  VALUES (auth.uid()::text, 'ADMIN_BALANCE_ADJUSTMENT', 'user', v_user.id::text,
          jsonb_build_object('amount', p_amount, 'note', p_note, 'balanceBefore', COALESCE(v_user.balance,0), 'balanceAfter', v_new));

  RETURN jsonb_build_object('status','success','balance', v_new);
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_balance(TEXT,BIGINT,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_balance(TEXT,BIGINT,TEXT) TO authenticated;

-- 2) RPC ADMIN HOÀN TIỀN ĐƠN (chỉ 1 lần, ledger REFUND, không sửa lịch sử)
CREATE OR REPLACE FUNCTION public.admin_refund_order(
  p_order_id TEXT,
  p_reason   TEXT DEFAULT ''
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_admin RECORD; v_order RECORD; v_user RECORD;
BEGIN
  SELECT * INTO v_admin FROM profiles WHERE id = auth.uid();
  IF NOT FOUND OR v_admin.role <> 'admin' THEN
    RETURN jsonb_build_object('status','error','code','FORBIDDEN');
  END IF;

  SELECT * INTO v_order FROM orders WHERE id::text = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','error','code','ORDER_NOT_FOUND'); END IF;
  IF v_order.status = 'refunded' THEN
    RETURN jsonb_build_object('status','error','code','ALREADY_REFUNDED');
  END IF;
  IF v_order.status <> 'completed' THEN
    RETURN jsonb_build_object('status','error','code','NOT_REFUNDABLE');
  END IF;

  SELECT * INTO v_user FROM profiles WHERE id::text = v_order.user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','error','code','USER_NOT_FOUND'); END IF;

  UPDATE orders SET status = 'refunded' WHERE id = v_order.id;
  UPDATE profiles SET balance = COALESCE(balance,0) + v_order.total_price WHERE id = v_user.id;

  INSERT INTO transactions (id, tx_code, type, user_id, user_name, description, amount, balance_after, status, created_at)
  VALUES ('tx-' || gen_random_uuid()::text,
          '#GD-' || upper(substr(md5(random()::text),1,8)),
          'refund',
          v_user.id::text, v_user.username,
          'Hoàn tiền đơn ' || v_order.order_code || ': ' || COALESCE(NULLIF(p_reason,''),'Theo yêu cầu'),
          v_order.total_price, COALESCE(v_user.balance,0) + v_order.total_price, 'completed', NOW());
  INSERT INTO audit_log (actor_id, action, target_type, target_id, detail)
  VALUES (auth.uid()::text, 'ORDER_REFUND', 'order', v_order.id::text,
          jsonb_build_object('orderCode', v_order.order_code, 'amount', v_order.total_price, 'reason', p_reason));

  RETURN jsonb_build_object('status','success','refunded', v_order.total_price);
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_refund_order(TEXT,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_refund_order(TEXT,TEXT) TO authenticated;

-- 3) Khóa bảng transactions: chỉ chủ sở hữu & admin đọc (insert chỉ qua RPC)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transactions_read_own" ON public.transactions;
CREATE POLICY "transactions_read_own" ON public.transactions
  FOR SELECT USING (
    auth.uid()::text = user_id::text
    OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
  );

-- 4) Dọn key/link sót trong settings productPackages (đã strip ở app từ giờ)
UPDATE public.store_settings
   SET settings_data = jsonb_set(settings_data, '{productPackages}',
     COALESCE((
       SELECT jsonb_object_agg(t.k, (
         SELECT jsonb_agg(x - 'keys' - 'downloadUrl') FROM jsonb_array_elements(t.v) AS x))
       FROM jsonb_each(settings_data->'productPackages') AS t(k, v)
     ), '{}'::jsonb))
 WHERE id = 'default';
