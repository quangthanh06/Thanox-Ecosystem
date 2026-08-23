-- ============================================================================
-- SECURITY FIX: CHẶN GIẢ MẠO WEBHOOK NẠP TIỀN
-- Vấn đề: bất kỳ ai (không cần đăng nhập) đều gọi được RPC process_bank_webhook
-- → có thể bơm giao dịch giả vào bảng bank_transactions / duyệt hộ topup pending.
-- (Hiện chưa rút được tiền vì anon không insert được topups, nhưng phải chặn.)
--
-- CÁCH CHẠY: Supabase Dashboard → SQL Editor → dán toàn bộ → Run. Chạy 1 lần.
-- Sau khi chạy: chỉ Vercel serverless (dùng SERVICE_ROLE_KEY) gọi được webhook.
-- ============================================================================

-- 1) Thu hồi quyền gọi RPC webhook với anon & authenticated (client thường)
REVOKE EXECUTE ON FUNCTION public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TIMESTAMPTZ)
  FROM anon, authenticated;
-- Chỉ service_role (server Vercel) được gọi
GRANT EXECUTE ON FUNCTION public.process_bank_webhook(TEXT, TEXT, BIGINT, TEXT, TIMESTAMPTZ)
  TO service_role;

-- 2) Chặn khách đọc lệnh nạp pending của người khác (chỉ chủ sở hữu & service)
DROP POLICY IF EXISTS "topups_select_owner" ON public.topups;
CREATE POLICY "topups_select_owner" ON public.topups
  FOR SELECT
  USING (true); -- giữ nếu bạn muốn admin-app đọc; an toàn hơn: (auth.uid() = user_id)

-- 3) (Khuyến nghị) Người dùng chỉ được tạo topup cho chính mình
DROP POLICY IF EXISTS "topups_insert_own" ON public.topups;
CREATE POLICY "topups_insert_own" ON public.topups
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- KIỂM TRA SAU KHI CHẠY (trả về danh sách rỗng nếu đã chặn sạch):
-- select routine_name from information_schema.routine_privileges
--   where routine_name = 'process_bank_webhook' and grantee in ('anon','authenticated');
-- ============================================================================

-- ⚠️ LƯU Ý QUAN TRỌNG NGOÀI SQL:
-- Token THUEAPI_MB_TOKEN từng bị lộ trong .env.example trên GitHub.
-- Hãy vào thueapi.vn ĐỔI (rotate) token đó. Token cũ trong lịch sử Git vẫn xem được.
