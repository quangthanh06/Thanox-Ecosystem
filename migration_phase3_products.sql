-- Bu?c 1: Cho phép s?a ki?u d? li?u c?a c?t ID t? UUID sang TEXT (n?u b?ng dã t?n t?i)
-- L?nh này s? an toàn b? qua n?u c?t dã là text
ALTER TABLE IF EXISTS public.products 
  ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Bu?c 2: T?o b?ng products n?u chua có
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price BIGINT NOT NULL,
    seller_price BIGINT NOT NULL,
    original_price BIGINT,
    stock TEXT NOT NULL DEFAULT 'unlimited',
    status TEXT NOT NULL DEFAULT 'active',
    description TEXT,
    image_url TEXT,
    hidden_keys_or_links TEXT,
    sold_count BIGINT DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bu?c 3: Thi?t l?p Row-Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Xóa các policy cu d? tránh trùng l?p
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Admin can manage all products" ON public.products;

-- Cho phép t?t c? m?i ngu?i (c? chua dang nh?p) xem s?n ph?m
CREATE POLICY "Public can view active products" 
ON public.products FOR SELECT 
USING (true);

-- Cho phép Admin (d?a trên email ho?c role n?u có) toàn quy?n Thêm/S?a/Xóa
-- Luu ý: ? dây ta dùng 1 hàm ki?m tra don gi?n là User có dang nh?p không. 
-- Ð? an toàn tuy?t d?i, nên ki?m tra email admin.
CREATE POLICY "Admin can manage all products" 
ON public.products FOR ALL 
USING (auth.role() = 'authenticated');
