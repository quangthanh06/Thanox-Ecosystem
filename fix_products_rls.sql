-- 1. Cho phép authenticated (bao gồm cả admin) có quyền sửa bảng products
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

-- 2. Đảm bảo RLS được bật cho bảng products (nếu bạn muốn bảo mật bằng RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. Cho phép tất cả mọi người có thể xem (SELECT) sản phẩm
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" 
ON public.products 
FOR SELECT 
USING (true);

-- 4. Cho phép ADMIN toàn quyền thêm/sửa/xoá (ALL) sản phẩm
DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
CREATE POLICY "Admin can manage products" 
ON public.products 
FOR ALL 
USING ( 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' 
)
WITH CHECK ( 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' 
);
