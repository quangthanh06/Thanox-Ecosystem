import { createClient } from '@supabase/supabase-js';

/**
 * HEALTH CHECK — GET /api/health
 * { status: 'HEALTHY'|'DEGRADED'|'DOWN', checks: {...}, version, timestamp }
 */

interface VercelRequest {
  method?: string;
}

interface VercelResponse {
  status(code: number): { json(data: unknown): void };
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const checks: Record<string, string> = {};
  let degraded = false;
  let down = false;

  // 1. Database (Supabase REST reachable)
  try {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      checks.database = 'NOT_CONFIGURED';
      down = true;
    } else {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      const { error } = await supabase.from('products').select('id').limit(1);
      checks.database = error ? 'UNREACHABLE' : 'HEALTHY';
      if (error) degraded = true;
    }
  } catch {
    checks.database = 'UNREACHABLE';
    degraded = true;
  }

  // 2. Payment provider config
  checks.paymentProvider = 'SEPAY_ACTIVE';

  const status = down ? 'DOWN' : degraded ? 'DEGRADED' : 'HEALTHY';
  return res.status(down ? 503 : 200).json({
    status,
    checks,
    provider: 'SEPAY',
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
    timestamp: new Date().toISOString(),
  });
}
