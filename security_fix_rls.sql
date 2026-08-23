-- ============================================================================
-- SECURITY FIX (v3 — chặn cả role PUBLIC, GRANT lại service_role, defaults topups)
--
-- Vấn đề đã audit & xác minh thực tế (2026-08-23):
--   1. ANON (không đăng nhập) gọi được RPC process_bank_webhook
--      → có thể bơm giao dịch giả / duyệt hộ topup pending của người khác.
--   2. RPC admin_approve_topup là SECURITY DEFINER (chạy với quyền admin)
--      → nếu public gọi được thì ai cũng duyệt topup tùy ý.
--   3. Người dùng (authenticated) chưa thể tự tạo topup của chính mình
--      → chặn đường nạp tự động end-to-end của THUEAPIBANK.
--   4. (v3) REVOKE từ anon/authenticated KHÔNG đủ — PostgreSQL mặc định cấp
--      EXECUTE cho role PUBLIC (mọi role kế thừa) → phải REVOKE từ PUBLIC
--      và GRANT trực tiếp lại cho service_role (Vercel serverless).
--   5. (v3) topups.id / request_code là TEXT NOT NULL KHÔNG default →
--      user insert bị lỗi null → thêm default an toàn (không đụng dòng cũ).
--
-- CÁCH CHẠY: Supabase Dashboard → SQL Editor → dán toàn bộ → Run (hoặc
-- node scripts/apply-sql.cjs). Idempotent: chạy lại bao nhiêu lần cũng an toàn.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) CHẶN MỌI TRUY CẬP PUBLIC VÀO RPC TÀI CHÍNH — từng overload, đúng chữ ký
--    Sau khi chạy: duy nhất service_role (Vercel) gọi được.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT p.proname,
           pg_get_function_identity_arguments(p.oid) AS argtypes
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname IN ('process_bank_webhook', 'admin_approve_topup')
      AND n.nspname = 'public'
  LOOP
    -- 1a. Thu hồi từ mọi role (PUBLIC = role đặc biệt gồm mọi role)
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated',
                   rec.proname, coalesce(rec.argtypes, ''));
    -- 1b. Cấp lại CHỈ cho server tin cậy (Vercel serverless)
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role',
                   rec.proname, coalesce(rec.argtypes, ''));
    RAISE NOTICE 'Đã khóa: %(%) — chỉ service_role được gọi', rec.proname, coalesce(rec.argtypes, '');
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                 WHERE p.proname IN ('process_bank_webhook', 'admin_approve_topup')
                   AND n.nspname = 'public') THEN
    RAISE NOTICE 'Không tìm thấy hàm cần chặn — bỏ qua (an toàn).';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) TOPUPS: người dùng chỉ được tạo & đọc topup CỦA CHÍNH MÌNH
--    (user_id là TEXT trên DB thật → cast hai phía để tránh uuid = text)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "topups_select_owner" ON public.topups;
CREATE POLICY "topups_select_owner" ON public.topups
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "topups_insert_own" ON public.topups;
CREATE POLICY "topups_insert_own" ON public.topups
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Người dùng KHÔNG được tự đổi sang approved (chỉ webhook/admin duyệt)
DROP POLICY IF EXISTS "topups_update_own_pending" ON public.topups;
CREATE POLICY "topups_update_own_pending" ON public.topups
  FOR UPDATE USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text AND status = 'pending');

-- Defaults cho cột NOT NULL đang thiếu (id/request_code TEXT không default)
-- → user insert không còn lỗi null; KHÔNG ảnh hưởng dòng đã có.
ALTER TABLE public.topups ALTER COLUMN id SET DEFAULT ('topup-' || gen_random_uuid()::text);
ALTER TABLE public.topups ALTER COLUMN request_code SET DEFAULT ('NAP-' || upper(substr(md5(random()::text), 1, 8)));

-- ---------------------------------------------------------------------------
-- 3) BANK TRANSACTIONS: chỉ service_role đọc (bypass RLS); public không đọc
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "bank_transactions_read_owner" ON public.bank_transactions;
CREATE POLICY "bank_transactions_read_owner" ON public.bank_transactions
  FOR SELECT USING (false);

-- ============================================================================
-- KIỂM TRA SAU KHI CHẠY (phải trả về 0 dòng):
--   SELECT grantee FROM information_schema.routine_privileges
--   WHERE routine_name = 'process_bank_webhook'
--     AND grantee IN ('PUBLIC','anon','authenticated');
-- ============================================================================
