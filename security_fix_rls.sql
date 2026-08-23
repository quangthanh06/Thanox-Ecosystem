-- ============================================================================
-- SECURITY FIX (v2 — an toàn, áp cho mọi overload, bỏ qua nếu chưa tồn tại)
--
-- Vấn đề đã audit & xác minh thực tế (2026-08-23):
--   1. ANON (không đăng nhập) gọi được RPC process_bank_webhook
--      → có thể bơm giao dịch giả / duyệt hộ topup pending của người khác.
--   2. RPC admin_approve_topup là SECURITY DEFINER (chạy với quyền admin)
--      → nếu public gọi được thì ai cũng duyệt topup tùy ý.
--   3. Người dùng (authenticated) chưa thể tự tạo topup của chính mình
--      → chặn đường nạp tự động end-to-end của THUEAPIBANK.
--
-- CÁCH CHẠY: Supabase Dashboard → SQL Editor → dán toàn bộ → Run. Chạy 1 lần.
-- Idempotent: chạy lại bao nhiêu lần cũng an toàn, không đụng hàm khác.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) CHẶN PUBLIC GỌI RPC TÀI CHÍNH — từng overload một, đúng tên hàm
--    Sau khi chạy: chỉ service_role (Vercel serverless) gọi được.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
   SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS argtypes
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname IN ('process_bank_webhook', 'admin_approve_topup')
      AND n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon, authenticated',
                   rec.proname, coalesce(rec.argtypes, ''));
    RAISE NOTICE 'Đã thu hồi EXECUTE public: %(%)', rec.proname, coalesce(rec.argtypes, '');
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                 WHERE p.proname IN ('process_bank_webhook', 'admin_approve_topup')
                   AND n.nspname = 'public') THEN
    RAISE NOTICE 'Không tìm thấy hàm cần chặn — bỏ qua (an toàn).';
  END IF;
END $$;

-- (service_role không bị ảnh hưởng — REVOKE chỉ áp cho anon/authenticated;
--  service_role giữ EXECUTE mặc định qua role PUBLIC)

-- ---------------------------------------------------------------------------
-- 2) TOPUPS: người dùng chỉ được tạo & đọc topup CỦA CHÍNH MÌNH
--    (webhook dùng service_role nên không bị ảnh hưởng)
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

-- ---------------------------------------------------------------------------
-- 3) BANK TRANSACTIONS: không cho public ghi (mặc định deny khi RLS bật;
--    giữ policy SELECT này nếu bảng chưa có policy đọc nào)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "bank_transactions_read_owner" ON public.bank_transactions;
CREATE POLICY "bank_transactions_read_owner" ON public.bank_transactions
  FOR SELECT USING (false); -- chỉ service_role (bypass RLS) đọc được

-- ============================================================================
-- KIỂM TRA SAU KHI CHẠY (phải trả về 0 dòng):
--   SELECT routine_name, grantee FROM information_schema.routine_privileges
--   WHERE routine_name IN ('process_bank_webhook','admin_approve_topup')
--     AND grantee IN ('anon','authenticated');
-- ============================================================================

-- ⚠️ LƯU Ý BẮT BUỘC NGOÀI SQL:
-- Token THUEAPI_MB_TOKEN cũ (b7872a...) đã từng lộ trên GitHub → PHẢI đổi trên thueapi.vn,
-- sau đó cập nhật lại ENV trên Vercel (MBBANK_SECRET_KEY + THUEAPI_MB_TOKEN mới).
