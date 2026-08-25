import { createClient } from '@supabase/supabase-js';

interface VercelRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ success: false, error: 'Database config missing' });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const targetNote = ((req.query?.note || req.body?.note || '') as string).trim();
  const targetUserId = ((req.query?.userId || req.body?.userId || '') as string).trim();

  try {
    // 1. TỐC ĐỘ CAO NHẤT (< 10ms): Kiểm tra ngay trong bảng topups xem đã approved chưa
    if (targetNote) {
      const { data: topupRow } = await adminClient
        .from('topups')
        .select('*')
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

      // 2. Kiểm tra xem SePay Webhook đã bắn tiền vào bảng bank_transactions chưa
      const { data: bankTx } = await adminClient
        .from('bank_transactions')
        .select('*')
        .ilike('content', '%' + targetNote + '%')
        .maybeSingle();

      if (bankTx && Number(bankTx.amount) > 0) {
        const amountReceived = Math.round(Number(bankTx.amount));
        const effectiveUserId = targetUserId || topupRow?.user_id;

        if (effectiveUserId) {
          // Lấy số dư hiện tại và cộng tiền
          const { data: profile } = await adminClient
            .from('profiles')
            .select('balance, username')
            .eq('id', effectiveUserId)
            .maybeSingle();

          const currentBal = Number(profile?.balance || 0);
          const updatedBal = currentBal + amountReceived;

          await adminClient
            .from('profiles')
            .update({ balance: updatedBal })
            .eq('id', effectiveUserId);

          // Cập nhật hoặc tạo mới bản ghi topups
          if (topupRow) {
            await adminClient
              .from('topups')
              .update({ status: 'approved', amount: amountReceived })
              .eq('id', topupRow.id);
          } else {
            await adminClient.from('topups').insert({
              user_id: effectiveUserId,
              user_name: profile?.username || 'Khách hàng',
              amount: amountReceived,
              status: 'approved',
              method: 'VietQR',
              transfer_note: targetNote,
              request_code: '#NAP-' + Math.floor(10000 + Math.random() * 90000),
            });
          }

          // Cập nhật bank_transactions
          await adminClient
            .from('bank_transactions')
            .update({ status: 'completed', matched_user_id: effectiveUserId })
            .eq('id', bankTx.id);

          return res.status(200).json({
            success: true,
            matched: true,
            status: 'approved',
            amount: amountReceived,
            newBalance: updatedBal,
            source: 'instant_bank_reconciliation',
          });
        }
      }
    }

    // 3. Nếu chưa có trong DB, chủ động gọi SePay API lấy 10 giao dịch mới nhất
    const sepayApiKey = process.env.SEPAY_API_KEY;
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
            const amountNum = typeof rawAmount === 'number' ? rawAmount : Number(String(rawAmount).replace(/[,\s]/g, ''));
            const desc = String(tx.transaction_content || tx.transactionContent || tx.content || tx.description || '').trim();
            const txId = String(tx.id || tx.reference_number || tx.referenceNumber || '').trim();
            const time = parseDate(tx.transaction_date || tx.transactionDate);

            if (!txId || amountNum <= 0 || !desc) continue;

            // Xử lý qua RPC hoặc trực tiếp
            await adminClient.rpc('process_bank_webhook', {
              p_provider: 'sepay',
              p_transaction_id: txId,
              p_amount: Math.round(amountNum),
              p_content: desc,
              p_transfer_time: time,
            });

            // Nếu giao dịch khớp đúng targetNote của user
            if (targetNote && desc.toLowerCase().includes(targetNote.toLowerCase())) {
              const effectiveUserId = targetUserId;
              if (effectiveUserId) {
                const { data: profile } = await adminClient
                  .from('profiles')
                  .select('balance')
                  .eq('id', effectiveUserId)
                  .maybeSingle();

                return res.status(200).json({
                  success: true,
                  matched: true,
                  status: 'approved',
                  amount: Math.round(amountNum),
                  newBalance: profile ? Number(profile.balance) : undefined,
                  source: 'direct_sepay_api_hit',
                });
              }
            }
          }
        }
      } catch (fetchErr) {
        console.warn('[check-bank] SePay API fetch error:', fetchErr);
      }
    }

    // 4. Kiểm tra lại lần cuối trong DB
    let isMatched = false;
    let finalBal: number | undefined;

    if (targetNote) {
      const { data: finalRow } = await adminClient
        .from('topups')
        .select('*')
        .ilike('transfer_note', '%' + targetNote + '%')
        .in('status', ['approved', 'paid'])
        .maybeSingle();

      if (finalRow) {
        isMatched = true;
        const { data: prof } = await adminClient
          .from('profiles')
          .select('balance')
          .eq('id', finalRow.user_id)
          .maybeSingle();
        if (prof) finalBal = Number(prof.balance);
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
    return res.status(200).json({ success: false, error: err?.message });
  }
}
