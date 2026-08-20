import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function signature
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Authenticate Request
  // (In production, checking headers/API key from SePay is strictly required)
  const apiKey = req.headers['authorization'];
  if (process.env.SEPAY_API_KEY && apiKey !== \Bearer \\) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { id, amount, content, transferTime } = req.body;

    if (!id || !amount || !content) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // 2. Init Supabase (Use SERVICE_ROLE_KEY to bypass RLS and act as admin)
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY; 

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials in ENV");
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // 3. Call the Secure RPC
    const { data, error } = await supabase.rpc('process_bank_webhook', {
      p_provider: 'sepay',
      p_transaction_id: String(id),
      p_amount: Number(amount),
      p_content: String(content),
      p_transfer_time: transferTime || new Date().toISOString()
    });

    if (error) {
      console.error('Supabase RPC Error:', error);
      return res.status(500).json({ error: 'Database transaction failed' });
    }

    // Return the response from the DB (e.g. success, manual_review, ignored)
    return res.status(200).json(data);

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
