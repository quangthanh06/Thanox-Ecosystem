const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const url = envFile.match(/VITE_SUPABASE_URL=(.+)/)[1];
const key = envFile.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1];
const supabase = createClient(url, key);
async function check() {
  const { data, error } = await supabase.from('products').select('*');
  console.log("Supabase Products Count:", data ? data.length : 0);
  console.log("Supabase Products Data:", data);
}
check();
