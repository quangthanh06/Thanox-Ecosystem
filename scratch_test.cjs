const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdmin() {
  console.log('Logging in as admin (trying email admin@thanox.vn)...');
  // Usually the identifier for admin in these systems is admin@... or we can just query users directly since anon key might have read access or we can just use the DB to check.
  
  // First, let's just query profiles since in my StoreContext fix, I do `supabase.from('profiles').select('*')` 
  console.log('\nFetching users from profiles table...');
  const { data: profiles, error: profError } = await supabase.from('profiles').select('*');
  
  if (profError) {
    console.error('Error fetching profiles (might need admin auth):', profError.message);
  } else {
    console.log(`Found ${profiles.length} users in profiles table:`);
    profiles.forEach(p => console.log(`- ${p.username} (${p.email}) [Role: ${p.role}] [Balance: ${p.balance}]`));
  }
}
testAdmin();
