import { createClient } from '@supabase/supabase-js';
import {
  isProviderPayload,
  normalizeTransactionList,
  getHistoryUrl,
  safeEqual,
  HISTORY_TIMEOUT_MS,
} from '../_lib/payment';

/**
 * THUEAPIBANK RECONCILIATION (đối soát khi webhook bị mất)
 * GET /api/cron/reconcile-thueapibank
 *
 * Auth: Vercel Cron tự gửi `Authorization: Bearer $CRON_SECRET`.
 *       Fail-closed: chưa cấu hình CRON_SECRET → từ chối (401).
 * Flow: GET https://thueapibank.vn/historyapimbv2/{THUEAPI_MB_TOKEN}
 *   → validate schema → với mỗi giao dịch IN hợp lệ gọi RPC process_bank_webhook
 *   (cùng đường với webhook → giao dịch đã xử lý tự bị ignore — idempotent,
 *    webhook + cron cùng TX = ĐÚNG MỘT credit).
 */

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
  query?: Record<string, any>;
}

interface VercelResponse {
  status(code: number): { json(data: unknown): void };
}

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
    // 1. Gọi GET history đúng spec, có timeout — không treo vô hạn
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HISTORY_TIMEOUT_MS);
    const historyUrl = getHistoryUrl();
    const response = await fetch(historyUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error: { code: 'PROVIDER_UNAVAILABLE', detail: `history HTTP ${response.status}` },
      });
    }

    const payload: unknown = await response.json();

    // 2. Validate schema — malformed thì KHÔNG xử lý tài chính
    if (!isProviderPayload(payload)) {
      return res.status(502).json({ success: false, error: { code: 'PROVIDER_RESPONSE_INVALID' } });
    }

    // 3. Forward từng giao dịch IN qua đúng RPC idempotent của webhook
    const { valid, skippedCount } = normalizeTransactionList(payload.transactions);
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
      skipped: skippedCount,
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
