const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const url = envFile.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const key = envFile.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();

const supabase = createClient(url, key);

async function check() {
  console.log("Attempting to upload to store_media...");
  const { data, error } = await supabase.storage
      .from('store_media')
      .upload('test.txt', 'hello world', {
        upsert: true,
      });
  
  if (error) {
    console.error("Upload Error:", error);
  } else {
    console.log("Upload Success:", data);
  }
}
check();
