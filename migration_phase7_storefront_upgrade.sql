-- ============================================================================
-- MIGRATION PHASE 7: NÂNG CẤP BẢNG PRODUCTS CHO STOREFRONT
-- Thêm cột packages (gói dịch vụ 1 ngày / 7 ngày / 1 tháng...) + trường mở rộng
--
-- CÁCH CHẠY: Mở Supabase Dashboard → SQL Editor → dán toàn bộ file này → Run.
-- An toàn: dùng IF NOT EXISTS, không làm mất dữ liệu hiện có.
-- Sau khi chạy xong, Admin cấu hình "Gói Key" sẽ được LÊN CLOUD và hiển thị
-- trên trang chi tiết sản phẩm cho mọi thiết bị (không chỉ máy admin).
-- ============================================================================

-- 1. Cột JSONB chứa danh sách gói dịch vụ:
--    [{ "id": "...", "name": "1 THÁNG", "price": 350000, "originalPrice": 400000,
--       "sellerPrice": 300000, "keys": "...", "downloadUrl": "..." }]
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS packages JSONB DEFAULT '[]'::jsonb;

-- 2. Loại sản phẩm: 'key' | 'account' | 'file'
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'key';

-- 3. Giảm giá SALE
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_sale BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_price BIGINT;

-- 4. Hướng dẫn sử dụng & danh sách tài khoản (sản phẩm loại account)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS accounts_list TEXT;

-- 5. Bộ ảnh gallery & link tải
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS download_url TEXT;

-- 6. Nổi bật & số lượng bán (đồng bộ thật thay vì reset về 0)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sold_count BIGINT DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- KIỂM TRA SAU KHI CHẠY (chạy từng câu lệnh SELECT để xác nhận):
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'products' ORDER BY ordinal_position;
-- SELECT name, jsonb_array_length(packages) AS so_goi FROM public.products;
-- ============================================================================
