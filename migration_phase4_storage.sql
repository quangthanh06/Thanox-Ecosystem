-- Bu?c 1: T?o Storage Bucket tên là "store_media" (n?u chua có) và b?t Public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'store_media', 
    'store_media', 
    true, 
    10485760, -- 10MB limit
    '{image/jpeg,image/png,image/gif,image/webp,audio/mpeg,audio/wav,audio/ogg,application/zip,application/x-rar-compressed,text/plain}'
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bu?c 2: Cho phép T?T C? M?I NGU?I (Public) d?c/t?i file t? bucket này
DROP POLICY IF EXISTS "Public can view store_media" ON storage.objects;
CREATE POLICY "Public can view store_media" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'store_media');

-- Bu?c 3: Cho phép Admin (dã dang nh?p) t?i file lên bucket này
DROP POLICY IF EXISTS "Admin can upload store_media" ON storage.objects;
CREATE POLICY "Admin can upload store_media" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'store_media' AND auth.role() = 'authenticated');

-- Bu?c 4: Cho phép Admin (dã dang nh?p) s?a/xóa file
DROP POLICY IF EXISTS "Admin can update store_media" ON storage.objects;
CREATE POLICY "Admin can update store_media" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'store_media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can delete store_media" ON storage.objects;
CREATE POLICY "Admin can delete store_media" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'store_media' AND auth.role() = 'authenticated');
