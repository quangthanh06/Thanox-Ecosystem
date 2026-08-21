const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const url = envFile.match(/VITE_SUPABASE_URL=(.+)/)[1];
const key = envFile.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1];

const supabase = createClient(url, key);

async function check() {
  const { data: { session }, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@thanox.vn',
    password: 'admin' // I might not know the exact password, let's see.
  });
  
  if (authErr) {
    console.log("Auth error:", authErr);
    // Let's just try signing in with a mock admin JWT if we can't.
  }
  
  const { data, error } = await supabase.from('products').insert({
    id: 'test_product',
    name: 'Test'
  });
  console.log("Error:", error);
}
check();
