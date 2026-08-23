import { createClient } from '@supabase/supabase-js';

/**
 * THUEAPIBANK RECONCILIATION (đối soát khi webhook bị mất)
 * GET /api/cron/reconcile-thueapibank  (cũng nhận POST để trigger tay)
 *
 * Auth: Vercel Cron tự gửi `Authorization: Bearer $CRON_SECRET`. FAIL-CLOSED:
 * chưa cấu hình CRON_SECRET → 401.
 *
 * Flow (ĐÚNG SPEC, không đoán):
 *   GET https://thueapibank.vn/historyapimbv2/{THUEAPI_MB_TOKEN}
 *   → { status:'success', transactions:[{ type:'IN', transactionID, amount:'50000',
 *       description, transactionDate:'14/01/2026' }] }
 *   → validate schema → mỗi TX IN hợp lệ gọi cùng RPC `process_bank_webhook`
 *     như webhook → giao dịch đã xử lý tự bị ignore (idempotent):
 *     webhook + cron cùng TX = ĐÚNG MỘT credit.
 *
 * Lưu ý deploy: KHÔNG import module ngoài thư mục này (giải thích ở mbbank.ts).
 * Logic parse giữ ĐỒNG BỘ với api/webhook/mbbank.ts và api/_lib/payment.test.ts.
 */

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
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

const HISTORY_TIMEOUT_MS = 10_000;

const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

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
// ===== End shared utilities =====

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED' } });
  }

  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers['authorization'];
  const provided = (Array.isArray(auth) ? auth[0] : auth) || '';
  if (!cronSecret || !safeEqual(provided, 'Bearer ' + cronSecret)) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
  }

  const token = process.env.THUEAPI_MB_TOKEN;
  if (!token) {
    return res.status(503).json({ success: false, error: { code: 'PROVIDER_NOT_CONFIGURED', detail: 'THUEAPI_MB_TOKEN missing' } });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }

  try {
    const base = process.env.THUEAPIBANK_HISTORY_URL || 'https://thueapibank.vn/historyapimbv2';
    const historyUrl = `${base}/${token}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HISTORY_TIMEOUT_MS);
    const response = await fetch(historyUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      return res.status(502).json({ success: false, error: { code: 'PROVIDER_UNAVAILABLE', detail: `history HTTP ${response.status}` } });
    }

    const payload: unknown = await response.json();
    if (!isProviderPayload(payload)) {
      return res.status(502).json({ success: false, error: { code: 'PROVIDER_RESPONSE_INVALID' } });
    }

    const valid: NormalizedTx[] = [];
    let skipped = 0;
    for (const tx of payload.transactions) {
      const n = normalizeTransaction(tx);
      if (n) valid.push(n);
      else skipped++;
    }

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    let credited = 0;
    let duplicate = 0;
    let review = 0;
    let errors = 0;

    for (const tx of valid) {
      const { data, error } = await supabase.rpc('process_bank_webhook', {
        p_provider: 'mbbank_thueapi',
        p_transaction_id: tx.transactionId,
        p_amount: tx.amount,
        p_content: tx.description,
        p_transfer_time: tx.transferTime,
      });
      if (error) {
        errors++;
        console.error('[RECONCILE] RPC error TX', tx.transactionId, error.message);
        continue;
      }
      const status = (data as { status?: string } | null)?.status;
      if (status === 'success') credited++;
      else if (status === 'ignored') duplicate++;
      else review++;
    }

    return res.status(200).json({
      success: true,
      fetched: payload.transactions.length,
      eligible: valid.length,
      skipped,
      credited,
      duplicateIgnored: duplicate,
      manualReview: review,
      errors,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    const code = (error as { name?: string })?.name === 'AbortError' ? 'PROVIDER_TIMEOUT' : 'INTERNAL_ERROR';
    console.error('[RECONCILE] error:', code);
    return res.status(code === 'PROVIDER_TIMEOUT' ? 504 : 500).json({ success: false, error: { code } });
  }
}
