const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const supabase = createClient(envFile.match(/VITE_SUPABASE_URL=(.+)/)[1], envFile.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1]);
async function check() {
  const { data, error } = await supabase.from('products').update({ name: 'Test' }).eq('id', 'prod-12345');
  console.log("Error:", error);
}
check();
