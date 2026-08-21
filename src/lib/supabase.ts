import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Thi?u bi?n môi tru?ng Supabase! Vui lòng ki?m tra file .env');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * @param file The file to upload
 * @param folder The folder inside the bucket (e.g., 'products', 'categories', 'settings')
 */
export const uploadMediaToSupabase = async (file: File, folder: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('store_media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from('store_media')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Error uploading media:', err);
    throw err;
  }
};
