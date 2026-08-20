import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // Yêu c?u secret key d? tránh ngu?i ngoài g?i b?a
  const secret = req.headers['authorization'];
  if (secret !== 'Bearer ' + process.env.VITE_SUPABASE_ANON_KEY) {
     return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Missing Supabase URL or Service Role Key in environment variables' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    // L?y toàn b? user t? b?ng cu (users_legacy)
    const { data: legacyUsers, error: fetchError } = await supabaseAdmin
      .from('users_legacy')
      .select('*');

    if (fetchError) {
      throw new Error('Failed to fetch legacy users: ' + fetchError.message);
    }

    if (!legacyUsers || legacyUsers.length === 0) {
      return res.status(200).json({ message: 'No legacy users found to migrate.' });
    }

    const results = [];
    const errors = [];

    // Chuy?n d?i t?ng user
    for (const oldUser of legacyUsers) {
      // B? qua n?u email/password không h?p l?
      if (!oldUser.email || !oldUser.password) {
         errors.push(`User ${oldUser.username} missing email or password.`);
         continue;
      }

      // T?o user m?i trên Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: oldUser.email,
        password: oldUser.password, // Supabase s? t? d?ng Bam (Hash) m?t kh?u này
        email_confirm: true, // Xác nh?n luôn d? không c?n verify qua mail
        user_metadata: {
          username: oldUser.username,
        }
      });

      if (authError) {
        errors.push(`Failed to migrate ${oldUser.email}: ${authError.message}`);
        continue;
      }

      // Trigger 'handle_new_user' ? Database dã t? t?o profile, nhung ta c?n update l?i balance và các tru?ng cu
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
          seller_approved_at: oldUser.seller_approved_at || null
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
      errors: errors
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
