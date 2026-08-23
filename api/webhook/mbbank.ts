import { createClient } from '@supabase/supabase-js';

/**
 * THUEAPIBANK (provider chính — MB Bank qua THUEAPI)
 * ------------------------------------------------
 * THUEAPI gửi lịch sử giao dịch MB Bank về endpoint này dưới dạng:
 * { status: 'success', transactions: [{ transactionID, amount, description,
 *   transactionDate, type: 'IN' | 'OUT' }] }
 *
 * Mỗi giao dịch được chuyển tiếp tới RPC `process_bank_webhook`
 * (provider = 'mbbank_thueapi') — RPC chịu trách nhiệm idempotency,
 * matching topup theo transfer_note, cộng ví và ghi ledger trong 1 transaction.
 *
 * Bảo mật: FAIL-CLOSED. Nếu MBBANK_SECRET_KEY chưa cấu hình → từ chối mọi request.
 * Chấp nhận secret qua header `signature` hoặc `Authorization: Bearer <secret>`.
 * (đọc kèm SEPAY_API_KEY cũ để tương thích cấu hình trước đây)
 */

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
}

interface VercelResponse {
  status(code: number): { json(data: unknown): void };
}

/** So sánh chuỗi hằng thời gian (chống timing attack) */
const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // === Fail-closed: buộc phải cấu hình secret mới nhận webhook ===
  const expectedSecret = process.env.MBBANK_SECRET_KEY || process.env.SEPAY_API_KEY;
  if (!expectedSecret) {
    console.error('[THUEAPIBANK] Missing MBBANK_SECRET_KEY env — webhook disabled (fail-closed)');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const signatureHeader = req.headers['signature'];
  const authHeader = req.headers['authorization'];
  const provided = (Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader) || '';
  const bearer = (Array.isArray(authHeader) ? authHeader[0] : authHeader) || '';

  const ok = safeEqual(provided, expectedSecret) || safeEqual(bearer, 'Bearer ' + expectedSecret);
  if (!ok) {
    console.error('[THUEAPIBANK] Signature mismatch — rejected');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = req.body || {};

    // Validate đúng cấu trúc THUEAPIBANK spec
    if (payload.status !== 'success' || !payload.transactions || !Array.isArray(payload.transactions)) {
      return res.status(400).json({ error: 'Invalid payload structure' });
    }

    const transactions = payload.transactions;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials in ENV');
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const results: Array<{ txId: string; data: unknown }> = [];

    for (const tx of transactions) {
      // Only process incoming transfers (IN)
      if (tx.type && tx.type !== 'IN') continue;

      const txId = tx.transactionID;
      const amount = tx.amount;
      const content = tx.description;
      const time = tx.transactionDate || new Date().toISOString();

      if (!txId || !amount || !content) continue;

      const { data, error } = await supabase.rpc('process_bank_webhook', {
        p_provider: 'mbbank_thueapi',
        p_transaction_id: String(txId),
        p_amount: Number(amount),
        p_content: String(content),
        p_transfer_time: String(time),
      });

      if (error) {
        console.error('Supabase RPC Error for TX:', txId, error);
      } else {
        results.push({ txId, data });
      }
    }

    // Always return 200 so THUEAPIBANK does not retry forever
    // (giao dịch duplicate tự bị bỏ qua ở RPC — idempotent)
    return res.status(200).json({ status: 'success', processed: results.length, results });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
