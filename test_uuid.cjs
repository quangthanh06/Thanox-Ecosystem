const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const url = envFile.match(/VITE_SUPABASE_URL=(.+)/)[1];
const key = envFile.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1];

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('products').insert({
    name: 'Test',
    category: 'Test',
    price: 100,
    seller_price: 100,
    original_price: 100,
    stock: 'unlimited',
    status: 'active',
    description: 'Test',
    image_url: 'http',
    hidden_keys_or_links: 'test'
  });
  console.log("Error:", error);
}
check();
