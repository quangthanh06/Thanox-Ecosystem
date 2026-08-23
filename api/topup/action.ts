import { createClient } from '@supabase/supabase-js';

interface VercelRequest {
  method?: string;
  body?: any;
}

interface VercelResponse {
  status(code: number): { json(data: unknown): void };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, id, transferNote, userId, amount } = req.body || {};

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ success: true, warning: 'Supabase credentials not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    if (action === 'clean_all_pending') {
      // Clean all pending topups
      const { data, error } = await supabase
        .from('topups')
        .update({ status: 'rejected' })
        .eq('status', 'pending');
      return res.status(200).json({ success: !error, error: error?.message, updated: data });
    }

    if (action === 'reject') {
      let query = supabase.from('topups').update({ status: 'rejected' });
      if (id) {
        query = query.eq('id', id);
      } else if (transferNote) {
        query = query.eq('transfer_note', transferNote);
      }
      const { error } = await query;
      return res.status(200).json({ success: !error, error: error?.message });
    }

    if (action === 'approve' || action === 'auto_approve') {
      // 1. Update topup record
      let topupQuery = supabase.from('topups').update({ status: 'approved' });
      if (id) {
        topupQuery = topupQuery.eq('id', id);
      } else if (transferNote) {
        topupQuery = topupQuery.eq('transfer_note', transferNote);
      }
      await topupQuery;

      // 2. Adjust user balance on profile if userId & amount present
      if (userId && amount) {
        try {
          const { data: userProfile } = await supabase.from('profiles').select('balance').eq('id', userId).maybeSingle();
          if (userProfile) {
            const currentBal = Number(userProfile.balance) || 0;
            await supabase.from('profiles').update({ balance: currentBal + Number(amount) }).eq('id', userId);
          }
        } catch (e) {
          console.error('[Action API] Failed to update profile balance:', e);
        }
      }

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
