import { createClient } from '@supabase/supabase-js';

// Minimal Vercel Serverless Function types (avoids implicit any from strict TS)
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Security: verify signature from headers if a secret is configured
  const signature = req.headers['signature'];
  const expectedSecret = process.env.MBBANK_SECRET_KEY;

  if (expectedSecret && signature !== expectedSecret) {
    console.error('Security error: signature mismatch!', signature);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = req.body || {};

    // Validate webhook JSON structure
    if (payload.status !== 'success' || !payload.transactions || !Array.isArray(payload.transactions)) {
      return res.status(400).json({ error: 'Invalid payload structure' });
    }

    const transactions = payload.transactions;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials in ENV');
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const results: Array<{ txId: string; data: unknown }> = [];

    for (const tx of transactions) {
      // Only process incoming transfers (IN)
      if (tx.type && tx.type !== 'IN') continue;

      const txId = tx.transactionID;
      const amount = tx.amount;
      const content = tx.description;
      const time = tx.transactionDate || new Date().toISOString();

      if (!txId || !amount || !content) continue;

      const { data, error } = await supabase.rpc('process_bank_webhook', {
        p_provider: 'mbbank_thueapi',
        p_transaction_id: String(txId),
        p_amount: Number(amount),
        p_content: String(content),
        p_transfer_time: String(time),
      });

      if (error) {
        console.error('Supabase RPC Error for TX:', txId, error);
      } else {
        results.push({ txId, data });
      }
    }

    // Always return 200 so the provider does not retry forever
    return res.status(200).json({ status: 'success', processed: results.length, results });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
