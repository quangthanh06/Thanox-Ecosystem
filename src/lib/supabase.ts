import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Thiếu biến môi trường Supabase! Vui lòng kiểm tra file .env');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * @param file The file to upload
 * @param folder The folder inside the bucket (e.g., 'products', 'categories', 'settings')
 */
export const uploadMediaToSupabase = async (file: File, folder: string): Promise<string> => {
  try {
    const rawExt = file.name.split('.').pop() || 'png';
    const cleanExt = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = `${cleanFolder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${cleanExt}`;

    const { data, error } = await supabase.storage
      .from('store_media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || (cleanExt === 'png' ? 'image/png' : cleanExt === 'jpg' || cleanExt === 'jpeg' ? 'image/jpeg' : 'application/octet-stream'),
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(error.message || 'Lỗi từ Supabase Storage');
    }

    const { data: publicUrlData } = supabase.storage
      .from('store_media')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.error('Error uploading media:', err);
    throw new Error(err?.message || 'Lỗi khi tải tệp lên Cloud');
  }
};
