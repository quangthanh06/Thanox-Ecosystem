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
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw.trim());
  if (!m) {
    const asIso = new Date(raw).getTime();
    return Number.isFinite(asIso) ? new Date(asIso).toISOString() : new Date().toISOString();
  }
  const date = new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 7, 0, 0));
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Cho phép cả GET và POST
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

  // Secret Key từ env hoặc settings
  const secretKey =
    process.env.THUEAPIBANK_SECRET_KEY ||
    process.env.THUEAPI_MB_TOKEN ||
    process.env.MBBANK_SECRET_KEY ||
    'ba8c2fdccf71d724f83956ede0261fc6'; // Khóa chuẩn từ ThueApiBank MBBank V4 (Merchant L4VH2S)

  const targetNote = (req.query?.note || req.body?.note || '') as string;

  try {
    // 1. Gọi trực tiếp API ThueApiBank V4/V2 lấy lịch sử giao dịch mới nhất
    const historyUrl = `https://thueapibank.vn/historyapimbv2/${secretKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const apiRes = await fetch(historyUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!apiRes.ok) {
      return res.status(200).json({
        success: false,
        warning: `ThueApiBank API returned ${apiRes.status}`,
      });
    }

    const payload: any = await apiRes.json();
    const transactions = payload?.transactions || payload?.data || [];

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(200).json({
        success: true,
        matched: false,
        message: 'Chưa có giao dịch mới trên ngân hàng',
      });
    }

    let isTargetMatched = false;
    const processedResults = [];

    // 2. Duyệt qua các giao dịch và đẩy vào RPC process_bank_webhook để khớp lệnh tự động
    for (const tx of transactions) {
      // Chỉ xét giao dịch tiền vào (IN)
      if (tx.type !== undefined && tx.type !== 'IN' && tx.type !== 'in' && tx.type !== '+') continue;

      const txId = String(tx.transactionID || tx.id || '').trim();
      const amountNum = typeof tx.amount === 'number' ? tx.amount : Number(String(tx.amount || '').replace(/[,\s]/g, ''));
      const desc = String(tx.description || tx.content || '').trim();
      const transferTime = parseVietnamDate(tx.transactionDate || tx.date);

      if (!txId || amountNum <= 0 || !desc) continue;

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

    // 3. Nếu có targetNote, kiểm tra xem đơn topup đó đã được approved chưa
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
