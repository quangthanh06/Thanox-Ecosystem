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

  const targetNote = ((req.query?.note || req.body?.note || '') as string).trim();

  try {
    // 1. TỐC ĐỘ CAO NHẤT (< 15ms): Kiểm tra ngay trong Supabase xem đơn đã approved qua Webhook chưa
    if (targetNote) {
      const { data: topupRow } = await supabase
        .from('topups')
        .select('id, status, amount, user_id')
        .ilike('transfer_note', '%' + targetNote + '%')
        .maybeSingle();

      if (topupRow && (topupRow.status === 'approved' || topupRow.status === 'paid')) {
        let isOwner = false;
        const authHeader = req.headers?.['authorization'];
        const token = (Array.isArray(authHeader) ? authHeader[0] : authHeader)?.replace(/^Bearer\s+/i, '').trim();
        if (token) {
          try {
            const { data: userData } = await supabase.auth.getUser(token);
            if (userData?.user?.id === topupRow.user_id) {
              isOwner = true;
            }
          } catch {}
        }

        let userBalance: number | undefined;
        if (isOwner) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', topupRow.user_id)
            .maybeSingle();
          if (prof) userBalance = Number(prof.balance);
        }

        return res.status(200).json({
          success: true,
          matched: true,
          status: topupRow.status,
          amount: topupRow.amount,
          newBalance: userBalance,
          source: 'instant_db_hit',
        });
      }
    }

    // 2. Nếu DB chưa duyệt, gọi API SePay lấy 5 giao dịch MỚI NHẤT (yêu cầu cấu hình SEPAY_API_KEY trong env)
    const sepayApiKey = process.env.SEPAY_API_KEY;

    let transactions: any[] = [];
    if (sepayApiKey) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      try {
        const apiRes = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=5', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${sepayApiKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        if (apiRes.ok) {
          const payload: any = await apiRes.json();
          if (Array.isArray(payload?.transactions)) {
            transactions = payload.transactions.slice(0, 5);
          }
        }
      } catch (fetchErr) {
        console.warn('[check-bank] External SePay fetch skipped / timed out:', fetchErr);
      }
    }

    let isTargetMatched = false;

    // 3. Xử lý song song (Parallel execution) các giao dịch tiền vào
    await Promise.all(
      transactions.map(async (tx) => {
        const rawAmount = tx.amount_in !== undefined ? tx.amount_in : (tx.amountIn ?? tx.amount ?? 0);
        const amountNum = typeof rawAmount === 'number' ? rawAmount : Number(String(rawAmount).replace(/[,\s]/g, ''));
        const desc = String(tx.transaction_content || tx.transactionContent || tx.content || tx.description || '').trim();
        const txId = String(tx.id || tx.reference_number || tx.referenceNumber || '').trim();
        const time = parseDate(tx.transaction_date || tx.transactionDate);

        if (!txId || amountNum <= 0 || !desc) return;

        const { data, error } = await supabase.rpc('process_bank_webhook', {
          p_provider: 'sepay',
          p_transaction_id: txId,
          p_amount: Math.round(amountNum),
          p_content: desc,
          p_transfer_time: time,
        });

        if (!error && data?.status === 'success') {
          if (targetNote && desc.toLowerCase().includes(targetNote.toLowerCase())) {
            isTargetMatched = true;
          }
        }
      })
    );

    // 4. Kiểm tra lại trạng thái sau khi quét
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
      ranAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(200).json({ success: false, error: err?.message });
  }
}
