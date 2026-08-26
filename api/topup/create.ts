import { createClient } from '@supabase/supabase-js';

interface VercelRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: any;
}

interface VercelResponse {
  status(code: number): { json(data: unknown): void };
}

/**
 * Topup Request Creation Handler (Production Grade)
 * 
 * - Fail-closed Database Connection (Service Role ONLY)
 * - Inserts pending topup record
 * - Automatically triggers atomic bank reconciliation via retry_bank_matching RPC
 * - Zero Client-Side or Serverless loose balance arithmetic
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[API Topup Create] Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL');
    return res.status(500).json({ success: false, error: 'Database service configuration missing' });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { userId, userName, amount, transferNote, method = 'VietQR' } = req.body || {};

    if (!userId || !amount || !transferNote) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters (userId, amount, transferNote)',
      });
    }

    const cleanAmount = Math.max(1000, Math.round(Number(amount)));
    const cleanNote = String(transferNote).trim();

    // 1. Create pending topup record using Service Role (Bypasses RLS)
    const requestCode = '#NAP-' + Math.floor(10000 + Math.random() * 90000);
    const { data: topupRow, error: insertErr } = await adminClient
      .from('topups')
      .insert({
        user_id: userId,
        user_name: userName || 'Khách hàng',
        amount: cleanAmount,
        status: 'pending',
        method: method,
        transfer_note: cleanNote,
        request_code: requestCode,
      })
      .select()
      .maybeSingle();

    if (insertErr || !topupRow) {
      console.error('[API Topup Create] Insert error:', insertErr);
      return res.status(500).json({ success: false, error: 'Failed to create topup request' });
    }

    // 2. Check if bank transaction already landed before topup creation (Atomic Retry Match via RPC)
    let isInstantCredited = false;
    let newBalance: number | undefined;

    try {
      const { data: rpcData, error: rpcErr } = await adminClient.rpc('retry_bank_matching', {
        p_topup_id: topupRow.id,
      });

      if (!rpcErr && rpcData?.status === 'success') {
        isInstantCredited = true;
        newBalance = rpcData.new_balance;
      }
    } catch (rpcEx) {
      console.warn('[API Topup Create] retry_bank_matching notice:', rpcEx);
    }

    return res.status(200).json({
      success: true,
      status: isInstantCredited ? 'approved' : 'pending',
      topup: topupRow,
      newBalance,
      isInstantCredited,
    });
  } catch (err: any) {
    console.error('[API Topup Create] Exception:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal error' });
  }
}
