import { createClient } from '@supabase/supabase-js';

interface VercelRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: any;
}

interface VercelResponse {
  status(code: number): { json(data: unknown): void };
}

const parseDate = (raw?: string): string => {
  if (!raw) return new Date().toISOString();
  const asIso = new Date(raw).getTime();
  return Number.isFinite(asIso) ? new Date(asIso).toISOString() : new Date().toISOString();
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ success: false, error: 'Database config missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
      },
    },
  });

  const sepayApiKey =
    process.env.SEPAY_API_KEY || 'NIWF2SUUD9L0AO3CUIJFY4FFPBJJTJTGLCVCHCLVZRBWMKSWVB31QKGNX5SQVERO';

  const targetNote = (req.query?.note || req.body?.note || '') as string;

  try {
    // 1. Quét trực tiếp lịch sử giao dịch từ SePay API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const apiRes = await fetch('https://my.sepay.vn/userapi/transactions/list', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sepayApiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    let transactions: any[] = [];
    if (apiRes.ok) {
      const payload: any = await apiRes.json();
      if (Array.isArray(payload?.transactions)) {
        transactions = payload.transactions;
      }
    }

    let isTargetMatched = false;
    const processedResults = [];

    // 2. Duyệt qua các giao dịch và đẩy vào RPC process_bank_webhook
    for (const tx of transactions) {
      const rawAmount = tx.amount_in !== undefined ? tx.amount_in : (tx.amountIn ?? tx.amount ?? 0);
      const amountNum = typeof rawAmount === 'number' ? rawAmount : Number(String(rawAmount).replace(/[,\s]/g, ''));
      const desc = String(tx.transaction_content || tx.transactionContent || tx.content || tx.description || '').trim();
      const txId = String(tx.id || tx.reference_number || tx.referenceNumber || '').trim();
      const time = parseDate(tx.transaction_date || tx.transactionDate);

      // Bỏ qua giao dịch tiền ra hoặc 0đ
      if (!txId || amountNum <= 0 || !desc) continue;

      const { data, error } = await supabase.rpc('process_bank_webhook', {
        p_provider: 'sepay',
        p_transaction_id: txId,
        p_amount: Math.round(amountNum),
        p_content: desc,
        p_transfer_time: time,
      });

      if (!error && data) {
        processedResults.push({ txId, result: data });
        if (data.status === 'success') {
          if (targetNote && desc.toLowerCase().includes(targetNote.toLowerCase())) {
            isTargetMatched = true;
          }
        }
      }
    }

    // 3. Kiểm tra xem đơn topup hiện tại đã approved chưa
    let topupStatus = 'pending';
    let newBalance: number | undefined;

    if (targetNote) {
      const { data: topupRow } = await supabase
        .from('topups')
        .select('id, status, amount, user_id')
        .ilike('transfer_note', '%' + targetNote + '%')
        .maybeSingle();

      if (topupRow && (topupRow.status === 'approved' || topupRow.status === 'paid')) {
        topupStatus = topupRow.status;
        isTargetMatched = true;

        const { data: prof } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', topupRow.user_id)
          .maybeSingle();

        if (prof) newBalance = Number(prof.balance);
      }
    }

    return res.status(200).json({
      success: true,
      matched: isTargetMatched,
      status: topupStatus,
      newBalance,
      processedCount: processedResults.length,
      ranAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[CheckBank SePay API] Error:', err);
    return res.status(200).json({ success: false, error: err?.message });
  }
}
