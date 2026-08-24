import { createClient } from '@supabase/supabase-js';

/**
 * THUEAPIBANK WEBHOOK (MB Bank qua thueapibank.vn)
 * POST /api/webhook/mbbank
 */

interface VercelRequest {
  method?: string;
  url?: string;
  query?: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
}

interface VercelResponse {
  status(code: number): { json(data: unknown): void };
}

interface ThueTx {
  type?: string;
  transactionID?: string | number;
  id?: string | number;
  amount?: string | number;
  description?: string;
  content?: string;
  transactionDate?: string;
  date?: string;
}

interface NormalizedTx {
  transactionId: string;
  amount: number;
  description: string;
  transferTime: string;
}

const MAX_WEBHOOK_BODY_BYTES = 512 * 1024;

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
  // Chấp nhận giao dịch type = IN hoặc không khai báo type (mặc định nạp tiền vào)
  if (tx.type !== undefined && tx.type !== 'IN' && tx.type !== 'in' && tx.type !== '+') return null;

  const rawId = tx.transactionID ?? tx.id;
  const transactionId = rawId === undefined ? '' : String(rawId).trim();
  if (!transactionId || transactionId.length > 100) return null;

  const amountNum = typeof tx.amount === 'number' ? tx.amount : Number(String(tx.amount ?? '').replace(/[,\s]/g, ''));
  if (!Number.isFinite(amountNum) || amountNum <= 0 || amountNum > 1_000_000_000) return null;

  const description = String(tx.description ?? tx.content ?? '').trim();
  if (!description) return null;

  return {
    transactionId,
    amount: Math.round(amountNum),
    description: description.slice(0, 500),
    transferTime: parseVietnamDate(tx.transactionDate ?? tx.date),
  };
};

const extractTransactions = (raw: any): ThueTx[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.transactions)) return raw.transactions;
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.transactionID || raw.id || raw.amount) return [raw];
  return [];
};

const getWebhookSecret = (): string | null =>
  process.env.THUEAPIBANK_SECRET_KEY || process.env.MBBANK_SECRET_KEY || process.env.SEPAY_API_KEY || 'af8cf61952466df0d38c02c5bfbccc5b';

const verifyWebhookAuth = (req: VercelRequest, expectedSecret: string | null): boolean => {
  if (!expectedSecret) return true; // Nếu chưa cấu hình secret thì cho phép qua để test không bị chặn 401

  // 1. Kiểm tra Headers
  const hSignature = (Array.isArray(req.headers['signature']) ? req.headers['signature'][0] : req.headers['signature']) || '';
  const hToken = (Array.isArray(req.headers['token']) ? req.headers['token'][0] : req.headers['token']) || '';
  const hApiKey = (Array.isArray(req.headers['x-api-key']) ? req.headers['x-api-key'][0] : req.headers['x-api-key']) || 
                  (Array.isArray(req.headers['apikey']) ? req.headers['apikey'][0] : req.headers['apikey']) || '';
  const hAuth = (Array.isArray(req.headers['authorization']) ? req.headers['authorization'][0] : req.headers['authorization']) || '';

  if (safeEqual(hSignature, expectedSecret) || safeEqual(hToken, expectedSecret) || safeEqual(hApiKey, expectedSecret) || safeEqual(hAuth, 'Bearer ' + expectedSecret)) {
    return true;
  }

  // 2. Kiểm tra Query Parameters (?token=xxx hoặc ?secret=xxx)
  const qToken = req.query?.token || req.query?.secret || req.query?.key || req.query?.apiKey;
  const queryStr = (Array.isArray(qToken) ? qToken[0] : qToken) || '';
  if (queryStr && safeEqual(queryStr, expectedSecret)) {
    return true;
  }

  // 3. Kiểm tra trường trong body
  const bodySecret = req.body?.secret || req.body?.token || req.body?.secretKey || req.body?.apiKey;
  if (bodySecret && safeEqual(String(bodySecret), expectedSecret)) {
    return true;
  }

  return false;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED' } });
  }

  const expectedSecret = getWebhookSecret();
  if (!verifyWebhookAuth(req, expectedSecret)) {
    console.warn('[THUEAPIBANK] Unauthorized webhook attempt');
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
  }

  try {
    const raw = req.body;
    if (raw && JSON.stringify(raw).length > MAX_WEBHOOK_BODY_BYTES) {
      return res.status(413).json({ success: false, error: { code: 'PAYLOAD_TOO_LARGE' } });
    }

    const txList = extractTransactions(raw);
    if (txList.length === 0) {
      console.warn('[THUEAPIBANK] No transactions found in payload:', raw);
      return res.status(200).json({ status: 'success', processed: 0, message: 'No transactions in payload' });
    }

    const valid: NormalizedTx[] = [];
    let skipped = 0;
    for (const tx of txList) {
      const n = normalizeTransaction(tx);
      if (n) valid.push(n);
      else skipped++;
    }

    if (valid.length === 0) {
      return res.status(200).json({ status: 'success', processed: 0, skipped });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[THUEAPIBANK] Missing Supabase credentials');
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
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

    const results: Array<{ txId: string; outcome: any }> = [];
    let rpcError = 0;

    for (const tx of valid) {
      console.log(`[THUEAPIBANK] Processing TX ${tx.transactionId}: ${tx.amount}đ - "${tx.description}"`);
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
        results.push({ txId: tx.transactionId, outcome: { error: error.message } });
      } else {
        console.log('[THUEAPIBANK] RPC success TX', tx.transactionId, data);
        results.push({ txId: tx.transactionId, outcome: data });
      }
    }

    return res.status(200).json({
      status: true,
      msg: 'OK',
      processed: results.length,
      skipped,
      rpcError,
      results: results.slice(0, 50),
    });
  } catch (error: any) {
    console.error('[THUEAPIBANK] Webhook processing exception:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error?.message } });
  }
}

