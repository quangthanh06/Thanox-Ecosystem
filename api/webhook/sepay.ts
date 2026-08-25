import { createClient } from '@supabase/supabase-js';

/**
 * SEPAY WEBHOOK (sepay.vn)
 * POST /api/webhook/sepay
 */

interface VercelRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
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

  // 1. Kiểm tra xác thực SePay Webhook (Fail-closed)
  const authHeader = req.headers?.['authorization'] || req.headers?.['apikey'] || req.headers?.['x-api-key'];
  const provided = (Array.isArray(authHeader) ? authHeader[0] : authHeader)?.replace(/^Bearer\s+/i, '').replace(/^Apikey\s+/i, '').trim() || '';
  const expectedKey = process.env.SEPAY_API_KEY;

  if (expectedKey) {
    if (!provided || !safeEqual(provided, expectedKey)) {
      console.warn('[SEPAY] Unauthorized webhook request with missing or invalid key');
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or missing API key' });
    }
  }

  try {
    const body = req.body || {};
    console.log('[SEPAY Webhook] Received payload:', JSON.stringify(body));

    // Hỗ trợ cả payload đơn hoặc danh sách mảng
    const rawList = Array.isArray(body) ? body : (body.transactions || [body]);
    const validTxs: Array<{ id: string; amount: number; content: string; time: string }> = [];

    for (const item of rawList) {
      if (!item || typeof item !== 'object') continue;

      const rawAmount = item.amountIn !== undefined ? item.amountIn : (item.amount_in !== undefined ? item.amount_in : (item.amount ?? 0));
      const amountNum = typeof rawAmount === 'number' ? rawAmount : Number(String(rawAmount).replace(/[,\s]/g, ''));
      const content = String(item.transactionContent || item.transaction_content || item.content || item.description || '').trim();
      const txId = String(item.id || item.referenceNumber || item.reference_number || item.code || '').trim();
      const time = parseDate(item.transactionDate || item.transaction_date || item.transferTime);

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
    });

    const results = [];
    for (const tx of validTxs) {
      console.log(`[SEPAY] Processing tx: ${tx.amount}đ - "${tx.content}" (ID: ${tx.id})`);

      // 1. Thực thi Stored Procedure RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('process_bank_webhook', {
        p_provider: 'sepay',
        p_transaction_id: tx.id,
        p_amount: tx.amount,
        p_content: tx.content,
        p_transfer_time: tx.time,
      });

      if (!rpcError && rpcData?.status === 'success') {
        results.push({ txId: tx.id, status: 'success', rpc: rpcData });
        continue;
      }

      // 2. Intelligent Fallback: Nếu RPC chưa khớp (do topup chưa kịp tạo hoặc sai định dạng), tự động khớp ngay
      console.log('[SEPAY] RPC did not directly succeed, running smart fallback match for:', tx.content);

      // Lưu transaction vào bank_transactions nếu chưa có
      await supabase
        .from('bank_transactions')
        .upsert(
          {
            provider: 'sepay',
            provider_transaction_id: tx.id,
            amount: tx.amount,
            content: tx.content,
            transfer_time: tx.time,
            status: 'pending',
          },
          { onConflict: 'provider,provider_transaction_id' }
        );

      // Tìm topup pending khớp nội dung
      const { data: pendingTopups } = await supabase
        .from('topups')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      let matchedTopup: any = null;
      if (pendingTopups && pendingTopups.length > 0) {
        matchedTopup = pendingTopups.find((t: any) => {
          if (!t.transfer_note) return false;
          const noteClean = t.transfer_note.trim().toLowerCase();
          const contentClean = tx.content.toLowerCase();
          return contentClean.includes(noteClean) || noteClean.includes(contentClean);
        });
      }

      if (matchedTopup) {
        console.log(`[SEPAY Fallback] Matched topup ${matchedTopup.id} for user ${matchedTopup.user_id}`);
        // Cộng tiền cho User
        const { data: prof } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', matchedTopup.user_id)
          .maybeSingle();

        const newBal = (Number(prof?.balance) || 0) + tx.amount;
        await supabase
          .from('profiles')
          .update({ balance: newBal })
          .eq('id', matchedTopup.user_id);

        await supabase
          .from('topups')
          .update({ status: 'approved', amount: tx.amount })
          .eq('id', matchedTopup.id);

        await supabase
          .from('bank_transactions')
          .update({ status: 'completed', matched_topup_id: matchedTopup.id, matched_user_id: matchedTopup.user_id })
          .eq('provider_transaction_id', tx.id);

        results.push({ txId: tx.id, status: 'fallback_success', userId: matchedTopup.user_id, amount: tx.amount });
      } else {
        // Tìm theo username trong nội dung chuyển khoản
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id, username, balance');

        let matchedProfile: any = null;
        if (allProfiles && allProfiles.length > 0) {
          matchedProfile = allProfiles.find((p: any) => {
            if (!p.username || p.username.length < 3) return false;
            return tx.content.toLowerCase().includes(p.username.toLowerCase());
          });
        }

        if (matchedProfile) {
          console.log(`[SEPAY Fallback] Matched username ${matchedProfile.username} directly from bank content!`);
          const newBal = (Number(matchedProfile.balance) || 0) + tx.amount;
          await supabase
            .from('profiles')
            .update({ balance: newBal })
            .eq('id', matchedProfile.id);

          await supabase.from('topups').insert({
            user_id: matchedProfile.id,
            user_name: matchedProfile.username,
            amount: tx.amount,
            status: 'approved',
            method: 'VietQR',
            transfer_note: tx.content,
            request_code: '#NAP-' + Math.floor(10000 + Math.random() * 90000),
          });

          await supabase
            .from('bank_transactions')
            .update({ status: 'completed', matched_user_id: matchedProfile.id })
            .eq('provider_transaction_id', tx.id);

          results.push({ txId: tx.id, status: 'username_direct_match', userId: matchedProfile.id, amount: tx.amount });
        } else {
          results.push({ txId: tx.id, status: 'manual_review', reason: 'no_matching_topup_or_user' });
        }
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
