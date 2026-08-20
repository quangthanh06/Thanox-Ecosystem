import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    
    // Thueapibank.vn thu?ng g?i v? m?t m?ng transactions (theo c?u trúc trong ?nh)
    // Ho?c g?i tr?c ti?p thông tin giao d?ch n?u ch? có 1. 
    // Ta linh ho?t x? lý c? 2 tru?ng h?p.
    const transactions = payload.transactions || [payload];

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY; 

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials in ENV");
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    const results = [];

    for (const tx of transactions) {
      // Ch? x? lý giao d?ch nh?n ti?n (IN)
      if (tx.type && tx.type !== 'IN') continue;
      
      // Map d? li?u t? thueapibank.vn sang chu?n c?a chúng ta
      const txId = tx.transactionID || tx.id || tx.refNo;
      const amount = tx.amount;
      const content = tx.description || tx.content;
      const time = tx.transactionDate || new Date().toISOString();

      if (!txId || !amount || !content) continue;

      const { data, error } = await supabase.rpc('process_bank_webhook', {
        p_provider: 'mbbank_thueapi',
        p_transaction_id: String(txId),
        p_amount: Number(amount),
        p_content: String(content),
        p_transfer_time: String(time)
      });

      if (error) {
        console.error('Supabase RPC Error for TX:', txId, error);
      } else {
        results.push({ txId, data });
      }
    }

    return res.status(200).json({ status: 'success', processed: results.length, results });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
