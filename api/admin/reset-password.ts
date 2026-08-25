import { createClient } from '@supabase/supabase-js';

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
}

interface VercelResponse {
  status(code: number): { json(data: unknown): void };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ success: false, error: 'Supabase configuration missing' });
  }

  // 1. Authenticate Admin Token
  const authHeader = req.headers['authorization'];
  const token = (Array.isArray(authHeader) ? authHeader[0] : authHeader)?.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return res.status(401).json({ success: false, error: 'Yêu cầu quyền Quản trị viên (Thiếu Access Token)' });
  }

  const authClient = createClient(supabaseUrl, anonKey || supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await authClient.auth.getUser(token);
  if (userErr || !userData?.user?.id) {
    return res.status(401).json({ success: false, error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Verify Admin Role
  const { data: adminProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!adminProfile || adminProfile.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Từ chối truy cập: Chỉ dành cho Super Admin' });
  }

  const { userId, newPassword } = req.body || {};

  if (!userId || !newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }

  try {
    // 2. Update password in Supabase Auth via Admin API
    const { error: updateAuthErr } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateAuthErr) {
      return res.status(400).json({ success: false, error: 'Lỗi cập nhật mật khẩu Auth: ' + updateAuthErr.message });
    }

    return res.status(200).json({ success: true, message: 'Đã cập nhật mật khẩu tài khoản thành công' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
  }
}
