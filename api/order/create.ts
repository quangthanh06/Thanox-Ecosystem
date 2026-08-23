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
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ success: false, code: 'DATABASE_CONFIG_MISSING', error: 'Cấu hình máy chủ cơ sở dữ liệu bị thiếu' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

  // 1. Xác thực danh tính người dùng: Ưu tiên JWT token, fallback userId hợp lệ từ session
  const authHeader = req.headers['authorization'];
  const token = (Array.isArray(authHeader) ? authHeader[0] : authHeader)?.replace(/^Bearer\s+/i, '').trim();

  let authenticatedUserId: string | null = null;

  if (token) {
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (!userErr && userData?.user?.id) {
      authenticatedUserId = userData.user.id;
    }
  }

  const { productId, packageId, quantity = 1, idempotencyKey, userId: bodyUserId } = req.body || {};
  const targetUserId = authenticatedUserId || bodyUserId;

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

  try {
    // 2. Thực thi 01 Transaction nguyên tử duy nhất trên Database qua RPC create_order_atomic
    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_order_atomic', {
      p_user_id: targetUserId,
      p_product_id: productId,
      p_package_id: packageId || null,
      p_quantity: qty,
      p_idem_key: idempotencyKey || null,
    });

    if (rpcError) {
      console.error('[API Order] RPC Execution Error:', rpcError);
      return res.status(500).json({
        success: false,
        code: 'DATABASE_ERROR',
        error: rpcError.message || 'Lỗi xử lý giao dịch máy chủ',
      });
    }

    if (!rpcResult || rpcResult.status !== 'success') {
      const code = rpcResult?.code || 'PURCHASE_FAILED';
      const msg = rpcResult?.error || 'Không thể tạo đơn hàng';
      return res.status(200).json({
        success: false,
        code,
        error: msg,
        balance: rpcResult?.balance,
        total: rpcResult?.total,
      });
    }

    // 3. Hoàn tất thành công — trả kết quả đơn hàng cho frontend
    return res.status(200).json({
      success: true,
      duplicate: Boolean(rpcResult.duplicate),
      order: rpcResult.order,
    });
  } catch (err) {
    console.error('[API Order] Server Exception:', err);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      error: 'Lỗi ngoại lệ hệ thống trong quá trình mua hàng',
    });
  }
}
