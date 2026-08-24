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
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', error: 'Phương thức không được hỗ trợ' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({
      success: false,
      code: 'DATABASE_CONFIG_MISSING',
      error: 'Thiếu SUPABASE_SERVICE_ROLE_KEY trên server',
    });
  }

  // 1. Xác thực danh tính người dùng độc lập (Auth Client)
  const authHeader = req.headers['authorization'];
  const token = (Array.isArray(authHeader) ? authHeader[0] : authHeader)?.replace(/^Bearer\s+/i, '').trim();

  let authenticatedUserId: string | null = null;

  if (token) {
    const authClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY || supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (!userErr && userData?.user?.id) {
      authenticatedUserId = userData.user.id;
    }
  }

  const { productId, packageId, quantity = 1, idempotencyKey } = req.body || {};
  const targetUserId = authenticatedUserId;

  if (!targetUserId) {
    return res.status(401).json({
      success: false,
      code: 'AUTH_FAILED',
      error: 'Vui lòng đăng nhập tài khoản để mua hàng.',
    });
  }

  if (!productId) {
    return res.status(400).json({ success: false, code: 'INVALID_INPUT', error: 'Thiếu mã sản phẩm cần mua' });
  }

  const qty = Math.max(1, Math.min(100, parseInt(String(quantity), 10) || 1));

  // 2. Client Admin độc lập tuyệt đối (CHỈ DÙNG CHO RPC create_order_atomic VỚI SERVICE ROLE)
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
      },
    },
  });

  try {
    // 3. Thực thi 01 Transaction nguyên tử duy nhất trên Database qua RPC create_order_atomic
    const { data: rpcResult, error: rpcError } = await adminClient.rpc('create_order_atomic', {
      p_user_id: targetUserId,
      p_product_id: productId,
      p_package_id: packageId || null,
      p_quantity: qty,
      p_idem_key: idempotencyKey || null,
    });

    if (rpcError) {
      let keyRole = 'unknown';
      let keyRef = 'unknown';
      try {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        const payload = JSON.parse(
          Buffer.from(serviceKey.split('.')[1], 'base64').toString('utf8')
        );
        keyRole = payload.role || 'missing';
        keyRef = payload.ref || 'missing';
      } catch (_) { }

      console.error('[API Order] RPC error:', rpcError.message, { keyRole, keyRef });

      return res.status(500).json({
        success: false,
        code: 'DATABASE_ERROR',
        error: rpcError.message,
        debug: { keyRole, keyRef },
      });
    }

    // 4. Hoàn tất thành công — trả kết quả đơn hàng cho frontend
    return res.status(200).json({
      success: true,
      duplicate: Boolean(rpcResult.duplicate),
      order: rpcResult.order,
    });
  } catch (err: any) {
    console.error('[API Order] Server Exception:', err);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      error: err?.message || 'Lỗi ngoại lệ hệ thống trong quá trình mua hàng',
    });
  }
}
