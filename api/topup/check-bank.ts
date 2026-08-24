import { createClient } from '@supabase/supabase-js';

interface VercelRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: any;
}

interface VercelResponse {
  status(code: number): { json(data: unknown): void };
}

const parseVietnamDate = (raw?: string): string => {
  if (!raw) return new Date().toISOString();
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(raw.trim());
  if (!m) {
    const asIso = new Date(raw).getTime();
    return Number.isFinite(asIso) ? new Date(asIso).toISOString() : new Date().toISOString();
  }
  const [, dd, mm, yyyy] = m;
  const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), 7, 0, 0));
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
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

  // Token MBBank trực tiếp từ ThueApiBank
  const token =
    process.env.THUEAPIBANK_SECRET_KEY ||
    process.env.THUEAPI_MB_TOKEN ||
    process.env.MBBANK_SECRET_KEY ||
    '6435ea8da5e1895782b53bc099d2e43e';

  const targetNote = (req.query?.note || req.body?.note || '') as string;

  try {
    // 1. Quét đồng thời cả API MBBank V1/V2 (historyapimbbank) và V4
    const endpoints = [
      `https://thueapibank.vn/historyapimbbank/${token}`,
      `https://thueapibank.vn/historyapimbbankv2/${token}`,
    ];

    let transactions: any[] = [];
    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const apiRes = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        if (apiRes.ok) {
          const payload: any = await apiRes.json();
          const list = payload?.TranList || payload?.transactions || payload?.data;
          if (Array.isArray(list) && list.length > 0) {
            transactions = list;
            break;
          }
        }
      } catch {}
    }

    let isTargetMatched = false;
    const processedResults = [];

    // 2. Duyệt qua các giao dịch và đẩy vào RPC process_bank_webhook để khớp lệnh tự động
    for (const tx of transactions) {
      const txId = String(tx.refNo || tx.tranId || tx.transactionID || tx.id || '').trim();
      const rawAmount = tx.creditAmount !== undefined ? tx.creditAmount : (tx.amount ?? 0);
      const amountNum = typeof rawAmount === 'number' ? rawAmount : Number(String(rawAmount).replace(/[,\s]/g, ''));
      const desc = String(tx.description || tx.content || '').trim();
      const transferTime = parseVietnamDate(tx.transactionDate || tx.postingDate || tx.date);

      // Bỏ qua giao dịch tiền ra hoặc số tiền không hợp lệ
      if (!txId || amountNum <= 0 || !desc) continue;
      if (tx.debitAmount && Number(tx.debitAmount) > 0 && Number(tx.creditAmount || 0) === 0) continue;

      // Gọi RPC nguyên tử
      const { data, error } = await supabase.rpc('process_bank_webhook', {
        p_provider: 'mbbank_thueapi',
        p_transaction_id: txId,
        p_amount: Math.round(amountNum),
        p_content: desc,
        p_transfer_time: transferTime,
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
    console.error('[CheckBank API] Error:', err);
    return res.status(200).json({ success: false, error: err?.message });
  }
}
