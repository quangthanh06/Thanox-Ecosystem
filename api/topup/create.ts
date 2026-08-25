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
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ success: false, error: 'Database config missing' });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { userId, userName, amount, transferNote, method = 'VietQR' } = req.body || {};

    if (!userId || !amount || !transferNote) {
      return res.status(400).json({ success: false, error: 'Missing required parameters (userId, amount, transferNote)' });
    }

    const cleanAmount = Math.max(1000, Math.round(Number(amount)));
    const cleanNote = String(transferNote).trim();

    // 1. Kiểm tra xem mã giao dịch này đã có tiền trong bank_transactions từ SePay chưa
    const { data: matchedBankTx } = await adminClient
      .from('bank_transactions')
      .select('*')
      .ilike('content', '%' + cleanNote + '%')
      .maybeSingle();

    let initialStatus = 'pending';
    let newBalance: number | undefined;

    if (matchedBankTx && Number(matchedBankTx.amount) >= cleanAmount) {
      // Đã có tiền từ SePay chuyển trước! Khớp ngay lập tức!
      const receivedAmt = Number(matchedBankTx.amount);
      const { data: profileData } = await adminClient
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .maybeSingle();

      const currentBal = Number(profileData?.balance || 0);
      const updatedBal = currentBal + receivedAmt;

      await adminClient
        .from('profiles')
        .update({ balance: updatedBal })
        .eq('id', userId);

      await adminClient
        .from('bank_transactions')
        .update({ status: 'completed', matched_user_id: userId })
        .eq('id', matchedBankTx.id);

      initialStatus = 'approved';
      newBalance = updatedBal;
    }

    // 2. Tạo đơn nạp tiền trong bảng topups bằng Service Role (Bypass RLS, 100% không bao giờ miss)
    const { data: topupRow, error: insertErr } = await adminClient
      .from('topups')
      .insert({
        user_id: userId,
        user_name: userName || 'Khách hàng',
        amount: cleanAmount,
        status: initialStatus,
        method: method,
        transfer_note: cleanNote,
        request_code: '#NAP-' + Math.floor(10000 + Math.random() * 90000),
      })
      .select()
      .maybeSingle();

    if (insertErr) {
      console.error('[API Topup Create] Insert error:', insertErr);
    }

    return res.status(200).json({
      success: true,
      status: initialStatus,
      topup: topupRow,
      newBalance,
      isInstantCredited: initialStatus === 'approved',
    });
  } catch (err: any) {
    console.error('[API Topup Create] Exception:', err);
    return res.status(500).json({ success: false, error: err?.message });
  }
}
