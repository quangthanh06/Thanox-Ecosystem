const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const url = envFile.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const key = envFile.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();

const supabase = createClient(url, key);

async function test() {
  // Register a dummy user
  const email = `test_${Date.now()}@example.com`;
  const password = "password123";
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email, password
  });
  
  if (signUpError) {
    console.error("SignUp Error:", signUpError);
    return;
  }
  
  console.log("Signed up:", email);
  
  // Wait for session
  const { data: { session } } = await supabase.auth.getSession();
  console.log("Has session:", !!session);

  // Upload image
  const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 'base64');
  
  const { data, error } = await supabase.storage
      .from('store_media')
      .upload(`products/test_${Date.now()}.png`, pngBuffer, {
        contentType: 'image/png',
        upsert: false,
      });
      
  if (error) {
    console.error("Upload Error:", error);
  } else {
    console.log("Upload Success:", data);
  }
}

test();
