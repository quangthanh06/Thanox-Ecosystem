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

interface LegacyUser {
  username: string;
  email?: string;
  password?: string;
  role?: string;
  balance?: number;
  total_spent?: number;
  status?: string;
  seller_status?: string | null;
  seller_note?: string | null;
  seller_applied_at?: string | null;
  seller_approved_at?: string | null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // Require a server secret key to prevent unauthorized calls
  const expectedSecret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = req.headers['authorization'];
  if (!expectedSecret || secret !== 'Bearer ' + expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized: Valid server secret required' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Missing Supabase URL or Service Role Key in environment variables' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // Fetch all users from the legacy table (users_legacy)
    const { data: legacyUsers, error: fetchError } = await supabaseAdmin
      .from('users_legacy')
      .select('*');

    if (fetchError) {
      throw new Error('Failed to fetch legacy users: ' + fetchError.message);
    }

    if (!legacyUsers || legacyUsers.length === 0) {
      return res.status(200).json({ message: 'No legacy users found to migrate.' });
    }

    const results: string[] = [];
    const errors: string[] = [];

    // Migrate each user one by one
    for (const oldUser of legacyUsers as LegacyUser[]) {
      // Skip if email/password is invalid
      if (!oldUser.email || !oldUser.password) {
        errors.push(`User ${oldUser.username} missing email or password.`);
        continue;
      }

      // Create new user on Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: oldUser.email,
        password: oldUser.password, // Supabase will hash this password automatically
        email_confirm: true, // Auto-confirm so no email verification needed
        user_metadata: {
          username: oldUser.username,
        },
      });

      if (authError || !authData.user) {
        errors.push(`Failed to migrate ${oldUser.email}: ${authError?.message ?? 'unknown error'}`);
        continue;
      }

      // The 'handle_new_user' DB trigger already created a profile; update legacy fields
      const newUserId = authData.user.id;

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          role: oldUser.role || 'user',
          balance: oldUser.balance || 0,
          total_spent: oldUser.total_spent || 0,
          status: oldUser.status || 'active',
          seller_status: oldUser.seller_status || null,
          seller_note: oldUser.seller_note || null,
          seller_applied_at: oldUser.seller_applied_at || null,
          seller_approved_at: oldUser.seller_approved_at || null,
        })
        .eq('id', newUserId);

      if (updateError) {
        errors.push(`Failed to update profile for ${oldUser.email}: ${updateError.message}`);
      } else {
        results.push(`Successfully migrated ${oldUser.email}`);
      }
    }

    return res.status(200).json({
      message: 'Migration completed',
      migratedCount: results.length,
      errorCount: errors.length,
      successes: results,
      errors: errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
