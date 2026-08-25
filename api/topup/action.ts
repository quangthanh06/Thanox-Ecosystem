import { createClient } from '@supabase/supabase-js';

interface VercelRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: any;
}

interface VercelResponse {
  status(code: number): { json(data: unknown): void };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ success: false, error: 'Database configuration missing' });
  }

  // 1. Authenticate Admin Token
  const authHeader = req.headers?.['authorization'];
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
    .select('role, username')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!adminProfile || adminProfile.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Từ chối truy cập: Chỉ dành cho Super Admin' });
  }

  try {
    const { action, id, transferNote, userId, amount } = req.body || {};

    if (action === 'clean_all_pending') {
      // Clean all pending topups
      const { data, error } = await adminClient
        .from('topups')
        .update({ status: 'rejected', reject_reason: 'Dọn dẹp bởi Admin' })
        .eq('status', 'pending');
      return res.status(200).json({ success: !error, error: error?.message, updated: data });
    }

    if (action === 'reject') {
      let query = adminClient.from('topups').update({ status: 'rejected', reject_reason: 'Từ chối bởi Admin' });
      if (id) {
        query = query.eq('id', id);
      } else if (transferNote) {
        query = query.eq('transfer_note', transferNote);
      }
      const { error } = await query;
      return res.status(200).json({ success: !error, error: error?.message });
    }

    if (action === 'approve' || action === 'auto_approve') {
      // 1. Find the pending topup row from DB first to get trusted userId and amount
      let selectQuery = adminClient.from('topups').select('*').eq('status', 'pending');
      if (id) {
        selectQuery = selectQuery.eq('id', id);
      } else if (transferNote) {
        selectQuery = selectQuery.eq('transfer_note', transferNote);
      }
      const { data: topupRow, error: findErr } = await selectQuery.maybeSingle();

      if (!topupRow || findErr) {
        return res.status(400).json({
          success: false,
          error: 'Yêu cầu nạp tiền không tồn tại hoặc đã được duyệt/xử lý trước đó',
        });
      }

      const targetUserId = topupRow.user_id;
      const targetAmount = Math.round(Number(topupRow.amount));

      if (!targetUserId || targetAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Dữ liệu giao dịch nạp tiền không hợp lệ' });
      }

      // 2. Atomically mark as approved where status = 'pending'
      const { error: updateErr } = await adminClient
        .from('topups')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', topupRow.id)
        .eq('status', 'pending');

      if (updateErr) {
        return res.status(500).json({ success: false, error: 'Không thể cập nhật trạng thái nạp tiền' });
      }

      // 3. Adjust user balance using atomic RPC ledger
      const { error: rpcErr } = await adminClient.rpc('admin_adjust_balance', {
        p_user_id: targetUserId,
        p_amount: targetAmount,
        p_note: `Duyệt nạp tiền thủ công Admin Panel (${topupRow.transfer_note || topupRow.id})`,
      });

      if (rpcErr) {
        console.warn('[Action API] RPC error:', rpcErr.message);
        // Fallback: direct update if RPC is missing
        const { data: userProfile } = await adminClient
          .from('profiles')
          .select('balance')
          .eq('id', targetUserId)
          .maybeSingle();
        if (userProfile) {
          const currentBal = Number(userProfile.balance) || 0;
          await adminClient
            .from('profiles')
            .update({ balance: currentBal + targetAmount })
            .eq('id', targetUserId);
        }
      }

      return res.status(200).json({ success: true, credited: targetAmount, userId: targetUserId });
    }

    return res.status(400).json({ success: false, error: 'Unknown action' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Internal error' });
  }
}
