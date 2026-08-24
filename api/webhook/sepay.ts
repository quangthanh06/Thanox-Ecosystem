import { createClient } from '@supabase/supabase-js';

/**
 * SEPAY WEBHOOK (sepay.vn)
 * POST /api/webhook/sepay
 *
 * Payload từ SePay:
 * {
 *   "id": 123456,
 *   "gateway": "MBBank",
 *   "transactionDate": "2024-08-24 17:15:00",
 *   "accountNumber": "0326884292",
 *   "subAccount": null,
 *   "amountIn": 10000,
 *   "amountOut": 0,
 *   "accumulated": 100000,
 *   "code": null,
 *   "transactionContent": "SHOPTHANOX123456 ...",
 *   "referenceNumber": "FT240...",
 *   "body": "..."
 * }
 */

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
}

interface VercelResponse {
  status(code: number): { json(data: unknown): void };
}

const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

const parseDate = (raw?: string): string => {
  if (!raw) return new Date().toISOString();
  const asIso = new Date(raw).getTime();
  return Number.isFinite(asIso) ? new Date(asIso).toISOString() : new Date().toISOString();
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // 1. Xác thực API Key nếu có cấu hình SEPAY_API_KEY
  const expectedKey = process.env.SEPAY_API_KEY || 'NIWF2SUUD9L0AO3CUIJFY4FFPBJJTJTGLCVCHCLVZRBWMKSWVB31QKGNX5SQVERO';
  if (expectedKey) {
    const authHeader = req.headers['authorization'] || req.headers['apikey'] || req.headers['x-api-key'];
    const provided = (Array.isArray(authHeader) ? authHeader[0] : authHeader)?.replace(/^Bearer\s+/i, '').replace(/^Apikey\s+/i, '').trim() || '';
    if (!safeEqual(provided, expectedKey)) {
      console.warn('[SEPAY] Unauthorized webhook request');
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
  }

  try {
    const body = req.body || {};
    console.log('[SEPAY Webhook] Incoming payload:', JSON.stringify(body));

    // Xử lý cả payload đơn hoặc danh sách
    const rawList = Array.isArray(body) ? body : (body.transactions || [body]);
    const validTxs: Array<{ id: string; amount: number; content: string; time: string }> = [];

    for (const item of rawList) {
      if (!item || typeof item !== 'object') continue;

      const rawAmount = item.amountIn !== undefined ? item.amountIn : (item.amount ?? 0);
      const amountNum = typeof rawAmount === 'number' ? rawAmount : Number(String(rawAmount).replace(/[,\s]/g, ''));
      const content = String(item.transactionContent || item.content || item.description || '').trim();
      const txId = String(item.id || item.referenceNumber || item.code || '').trim();
      const time = parseDate(item.transactionDate || item.transferTime);

      if (amountNum > 0 && content && txId) {
        validTxs.push({ id: txId, amount: Math.round(amountNum), content, time });
      }
    }

    if (validTxs.length === 0) {
      return res.status(200).json({ success: true, processed: 0, message: 'No valid deposit transactions' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[SEPAY] Missing Supabase credentials in ENV');
      return res.status(500).json({ success: false, error: 'Database credentials missing' });
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

    const results = [];
    for (const tx of validTxs) {
      console.log(`[SEPAY] Processing: ${tx.amount}đ - "${tx.content}" (ID: ${tx.id})`);
      const { data, error } = await supabase.rpc('process_bank_webhook', {
        p_provider: 'sepay',
        p_transaction_id: tx.id,
        p_amount: tx.amount,
        p_content: tx.content,
        p_transfer_time: tx.time,
      });

      if (error) {
        console.error('[SEPAY] RPC error:', error.message);
        results.push({ txId: tx.id, error: error.message });
      } else {
        console.log('[SEPAY] RPC success:', data);
        results.push({ txId: tx.id, outcome: data });
      }
    }

    return res.status(200).json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('[SEPAY] Webhook processing exception:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal Server Error' });
  }
}
