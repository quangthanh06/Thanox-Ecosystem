const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const url = envFile.match(/VITE_SUPABASE_URL=(.+)/)[1];
const key = envFile.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1];
const supabase = createClient(url, key);
async function check() {
  const { data, error } = await supabase.from('products').update({ name: 'Test' }).eq('id', '2');
  console.log("Error:", error);
}
check();
