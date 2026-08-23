import { createClient } from '@supabase/supabase-js';
import {
  isProviderPayload,
  normalizeTransactionList,
  verifyWebhookAuth,
  getWebhookSecret,
  MAX_WEBHOOK_BODY_BYTES,
} from '../lib/payment';

/**
 * THUEAPIBANK WEBHOOK (provider chính — MB Bank qua THUEAPI)
 * POST /api/webhook/mbbank
 * Headers: Content-Type: application/json, signature: <provider secret>
 * Payload (đúng spec): { status:'success', message, transactions:[{
 *   type:'IN', transactionID, amount:'100000', description }] }
 * → Mỗi giao dịch IN hợp lệ được chuyển tiếp tới RPC `process_bank_webhook`
 *   (provider='mbbank_thueapi') — RPC đảm bảo idempotency + matching +
 *   cộng ví + ledger trong MỘT database transaction.
 * Bảo mật: FAIL-CLOSED + so sánh hằng thời gian + giới hạn body.
 */

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
}

interface VercelResponse {
  status(code: number): { json(data: unknown): void };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED' } });
  }

  // === Fail-closed auth ===
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
    // Body size guard (stringified check — Vercel đã parse JSON, ước lượng bằng JSON length)
    if (raw && JSON.stringify(raw).length > MAX_WEBHOOK_BODY_BYTES) {
      return res.status(413).json({ success: false, error: { code: 'PAYLOAD_TOO_LARGE' } });
    }

    // === Schema validation theo spec — KHÔNG xử lý tài chính nếu malformed ===
    if (!isProviderPayload(raw)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_PAYLOAD' } });
    }

    const { valid, skippedCount, skipReasons } = normalizeTransactionList(raw.transactions);
    if (valid.length === 0) {
      // Trả 200 đúng flow provider (không có giao dịch hợp lệ nào — không credit)
      return res.status(200).json({ status: 'success', processed: 0, skipped: skippedCount, reasons: skipReasons.slice(0, 5) });
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
        console.error('[THUEAPIBANK] RPC error for TX', tx.transactionId, error.message);
      } else {
        results.push({ txId: tx.transactionId, outcome: (data && (data as { status?: string }).status) || 'unknown' });
      }
    }

    // Luôn 200 với provider (retry không cần — RPC idempotent, duplicate bị ignore)
    return res.status(200).json({
      status: 'success',
      processed: results.length,
      skipped: skippedCount,
      rpcError,
      results: results.slice(0, 50),
    });
  } catch (error) {
    console.error('[THUEAPIBANK] Webhook processing error');
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
}
