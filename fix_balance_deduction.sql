-- =====================================================
-- FIX TRIỆT ĐỂ: Trừ tiền trong bảng profiles khi mua hàng
-- COPY TOÀN BỘ FILE NÀY → SUPABASE SQL EDITOR → RUN
-- =====================================================

-- 1. TẮT RLS trên profiles hoàn toàn
--    (Kiểm soát bằng GRANT/REVOKE thay vì RLS policy)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Chỉ cho phép anon/authenticated ĐỌC (SELECT)
--    Mọi UPDATE/INSERT/DELETE chỉ có thể qua service_role/postgres
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;

-- 3. Verify: Kiểm tra balance hiện tại
SELECT id, username, balance, total_spent FROM profiles WHERE username LIKE '%quangthanh%';

-- 4. Test UPDATE trực tiếp (phải trả về 1 row)
UPDATE profiles SET balance = balance WHERE username LIKE '%quangthanh%' RETURNING id, username, balance;
