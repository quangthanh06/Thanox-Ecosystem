CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY,
    settings_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- B?t b?o m?t RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Ai cung có th? xem c?u hình (d? di?n tho?i c?a khách t?i du?c nh?c/banner)
DROP POLICY IF EXISTS "Public can view settings" ON public.store_settings;
CREATE POLICY "Public can view settings" 
ON public.store_settings FOR SELECT 
USING (true);

-- Ch? Admin m?i du?c luu c?u hình
DROP POLICY IF EXISTS "Admin can manage settings" ON public.store_settings;
CREATE POLICY "Admin can manage settings" 
ON public.store_settings FOR ALL 
USING (auth.role() = 'authenticated');
