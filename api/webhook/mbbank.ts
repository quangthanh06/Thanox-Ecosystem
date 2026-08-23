import { createClient } from '@supabase/supabase-js';

/**
 * THUEAPIBANK WEBHOOK (provider chính — MB Bank qua THUEAPI)
 * POST /api/webhook/mbbank | Headers: Content-Type: application/json, signature: <secret>
 *
 * Payload ĐÚNG THEO SPEC (không thêm, không đoán):
 * { status:'success', message, transactions:[{
 *     type:'IN', transactionID:'...', amount:'100000', description:'...' }] }
 *   - amount là STRING số; transactionDate (nếu có) dạng dd/MM/yyyy → parse ISO.
 *   - Chỉ type='IN' được xét; mỗi TX hợp lệ forward sang RPC `process_bank_webhook`
 *     (provider='mbbank_thueapi') đảm bảo idempotency + match + credit + ledger
 *     trong MỘT database transaction.
 *
 * Lưu ý deploy: KHÔNG import module ngoài thư mục này — @vercel/node không trace
 * dependency lên cấp cha. Logic parse giữ ĐỒNG BỘ với api/cron/reconcile-thueapibank.ts
 * và bộ test api/_lib/payment.test.ts.
 *
 * Bảo mật: FAIL-CLOSED (thiếu secret = từ chối), so sánh hằng thời gian, body cap 256KB.
 */

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
}

interface VercelResponse {
  status(code: number): { json(data: unknown): void };
}

// ===== Shared THUEAPIBANK utilities (inline — mirror of api/_lib/payment.ts) =====
interface ThueTx {
  type?: string;
  transactionID?: string | number;
  amount?: string | number;
  description?: string;
  transactionDate?: string;
}
interface NormalizedTx {
  transactionId: string;
  amount: number;
  description: string;
  transferTime: string;
}

const MAX_WEBHOOK_BODY_BYTES = 256 * 1024;

const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

/** dd/MM/yyyy → ISO (midday +07 để an toàn múi giờ); fallback: now/ISO */
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

/** Chuẩn hóa 1 TX theo spec; null = không hợp lệ (không bao giờ credit) */
const normalizeTransaction = (tx: ThueTx): NormalizedTx | null => {
  if (!tx || typeof tx !== 'object') return null;
  if (tx.type !== undefined && tx.type !== 'IN') return null;
  const transactionId = tx.transactionID === undefined ? '' : String(tx.transactionID).trim();
  if (!transactionId || transactionId.length > 100) return null;
  const amountNum = typeof tx.amount === 'number' ? tx.amount : Number(String(tx.amount ?? '').replace(/[,\s]/g, ''));
  if (!Number.isFinite(amountNum) || amountNum <= 0 || amountNum > 1_000_000_000) return null;
  const description = String(tx.description ?? '').trim();
  if (!description) return null;
  return {
    transactionId,
    amount: Math.round(amountNum),
    description: description.slice(0, 500),
    transferTime: parseVietnamDate(tx.transactionDate),
  };
};

const isProviderPayload = (payload: unknown): payload is { transactions: ThueTx[] } => {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as { status?: unknown; transactions?: unknown };
  return p.status === 'success' && Array.isArray(p.transactions);
};

const getWebhookSecret = (): string | null =>
  process.env.THUEAPIBANK_SECRET_KEY || process.env.MBBANK_SECRET_KEY || process.env.SEPAY_API_KEY || null;

const verifyWebhookAuth = (
  signatureHeader: string | string[] | undefined,
  authorizationHeader: string | string[] | undefined,
  expectedSecret: string | null
): boolean => {
  if (!expectedSecret) return false; // fail-closed
  const provided = (Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader) || '';
  const bearer = (Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader) || '';
  return safeEqual(provided, expectedSecret) || safeEqual(bearer, 'Bearer ' + expectedSecret);
};
// ===== End shared utilities =====

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED' } });
  }

  const expectedSecret = getWebhookSecret();
  if (!expectedSecret) {
    console.error('[THUEAPIBANK] No secret configured (THUEAPIBANK_SECRET_KEY/MBBANK_SECRET_KEY) — disabled');
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
  }
  if (!verifyWebhookAuth(req.headers['signature'], req.headers['authorization'], expectedSecret)) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
  }

  try {
    const raw = req.body;
    if (raw && JSON.stringify(raw).length > MAX_WEBHOOK_BODY_BYTES) {
      return res.status(413).json({ success: false, error: { code: 'PAYLOAD_TOO_LARGE' } });
    }
    if (!isProviderPayload(raw)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_PAYLOAD' } });
    }

    const valid: NormalizedTx[] = [];
    let skipped = 0;
    for (const tx of raw.transactions) {
      const n = normalizeTransaction(tx);
      if (n) valid.push(n);
      else skipped++;
    }
    if (valid.length === 0) {
      return res.status(200).json({ status: 'success', processed: 0, skipped });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.error('[THUEAPIBANK] Missing Supabase credentials');
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const results: Array<{ txId: string; outcome: string }> = [];
    let rpcError = 0;

    for (const tx of valid) {
      const { data, error } = await supabase.rpc('process_bank_webhook', {
        p_provider: 'mbbank_thueapi',
        p_transaction_id: tx.transactionId,
        p_amount: tx.amount,
        p_content: tx.description,
        p_transfer_time: tx.transferTime,
      });
      if (error) {
        rpcError++;
        console.error('[THUEAPIBANK] RPC error TX', tx.transactionId, error.message);
      } else {
        results.push({ txId: tx.transactionId, outcome: (data && (data as { status?: string }).status) || 'unknown' });
      }
    }

    return res.status(200).json({
      status: 'success',
      processed: results.length,
      skipped,
      rpcError,
      results: results.slice(0, 50),
    });
  } catch (error) {
    console.error('[THUEAPIBANK] Webhook processing error');
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
}
