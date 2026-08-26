import { createClient } from '@supabase/supabase-js';

interface VercelRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
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

/**
 * Bank Status Check & Reconciliation Endpoint (Production Grade)
 * 
 * - Fail-closed Database Connection (Service Role ONLY)
 * - 100% Atomic Reconciliation via retry_bank_matching / process_bank_webhook RPCs
 * - Zero direct balance mutation
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[API Check Bank] Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL');
    return res.status(500).json({ success: false, error: 'Database service configuration missing' });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const targetNote = String(req.query?.note || req.body?.note || '').trim();
  const targetUserId = String(req.query?.userId || req.body?.userId || '').trim();

  try {
    // 1. Check if topup is already approved in DB
    if (targetNote) {
      const { data: topupRow } = await adminClient
        .from('topups')
        .select('id, user_id, amount, status')
        .ilike('transfer_note', '%' + targetNote + '%')
        .maybeSingle();

      if (topupRow && (topupRow.status === 'approved' || topupRow.status === 'paid')) {
        const { data: prof } = await adminClient
          .from('profiles')
          .select('balance')
          .eq('id', topupRow.user_id)
          .maybeSingle();

        return res.status(200).json({
          success: true,
          matched: true,
          status: 'approved',
          amount: Number(topupRow.amount),
          newBalance: prof ? Number(prof.balance) : undefined,
          source: 'instant_topup_hit',
        });
      }

      // 2. If topup is pending, trigger atomic retry match against bank_transactions
      if (topupRow && topupRow.status === 'pending') {
        const { data: retryData } = await adminClient.rpc('retry_bank_matching', {
          p_topup_id: topupRow.id,
        });

        if (retryData?.status === 'success') {
          return res.status(200).json({
            success: true,
            matched: true,
            status: 'approved',
            amount: Number(retryData.added_amount || topupRow.amount),
            newBalance: retryData.new_balance,
            source: 'rpc_retry_match',
          });
        }
      }
    }

    // 3. Fallback: Query SePay API directly if configured
    const sepayApiKey = (process.env.SEPAY_API_KEY || '').trim().replace(/^["']|["']$/g, '');
    if (sepayApiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const apiRes = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=10', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${sepayApiKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        if (apiRes.ok) {
          const payload: any = await apiRes.json();
          const txList = Array.isArray(payload?.transactions) ? payload.transactions : [];

          for (const tx of txList) {
            const rawAmount = tx.amount_in !== undefined ? tx.amount_in : (tx.amountIn ?? tx.amount ?? 0);
            const amountNum = typeof rawAmount === 'number'
              ? rawAmount
              : Number(String(rawAmount).replace(/[,\s]/g, ''));
            const desc = String(tx.transaction_content || tx.transactionContent || tx.content || tx.description || '').trim();
            const txId = String(tx.id || tx.reference_number || tx.referenceNumber || '').trim();
            const time = parseDate(tx.transaction_date || tx.transactionDate);

            if (!txId || amountNum <= 0 || !desc) continue;

            // Atomic ingestion via process_bank_webhook RPC
            await adminClient.rpc('process_bank_webhook', {
              p_provider: 'sepay',
              p_transaction_id: txId,
              p_amount: Math.round(amountNum),
              p_content: desc,
              p_transfer_time: time,
            });
          }
        }
      } catch (fetchErr) {
        console.warn('[check-bank] SePay API fetch error:', fetchErr);
      }
    }

    // 4. Final DB state check
    let isMatched = false;
    let finalBal: number | undefined;

    if (targetNote) {
      const { data: finalRow } = await adminClient
        .from('topups')
        .select('user_id, status')
        .ilike('transfer_note', '%' + targetNote + '%')
        .in('status', ['approved', 'paid'])
        .maybeSingle();

      if (finalRow) {
        isMatched = true;
        const uid = finalRow.user_id || targetUserId;
        if (uid) {
          const { data: prof } = await adminClient
            .from('profiles')
            .select('balance')
            .eq('id', uid)
            .maybeSingle();
          if (prof) finalBal = Number(prof.balance);
        }
      }
    }

    return res.status(200).json({
      success: true,
      matched: isMatched,
      status: isMatched ? 'approved' : 'pending',
      newBalance: finalBal,
      checkedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[check-bank] Exception:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal Server Error' });
  }
}
