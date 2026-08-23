import { createClient } from '@supabase/supabase-js';

/**
 * ⚠️ LEGACY / BACKWARD-COMPATIBILITY ONLY
 * Provider thanh toán chính thức là THUEAPIBANK (MB Bank qua THUEAPI) — xem api/webhook/mbbank.ts.
 * Endpoint SePay này được giữ lại chỉ để tương thích cấu hình cũ; mỗi giao dịch vẫn
 * đi qua cùng RPC idempotent `process_bank_webhook` nên KHÔNG bao giờ cộng tiền 2 lần
 * dù cùng giao dịch đến từ cả hai kênh.
 *
 * Bảo mật: FAIL-CLOSED — thiếu SEPAY_API_KEY trong ENV → từ chối mọi request.
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
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Fail-closed: bắt buộc có API key từ SePay
  const apiKey = req.headers['authorization'];
  const provided = (Array.isArray(apiKey) ? apiKey[0] : apiKey) || '';
  if (!process.env.SEPAY_API_KEY || provided !== 'Bearer ' + process.env.SEPAY_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { id, amount, content, transferTime } = req.body || {};

    if (!id || !amount || !content) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials in ENV');
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.rpc('process_bank_webhook', {
      p_provider: 'sepay',
      p_transaction_id: String(id),
      p_amount: Number(amount),
      p_content: String(content),
      p_transfer_time: transferTime || new Date().toISOString(),
    });

    if (error) {
      console.error('Supabase RPC Error:', error);
      return res.status(500).json({ error: 'Database transaction failed' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
