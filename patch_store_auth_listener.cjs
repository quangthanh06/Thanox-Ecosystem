const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

// Replace the auth state listener to also fetch profiles
const regex = /const \{ data: \{ subscription \} \} = supabase\.auth\.onAuthStateChange\(\(_event, session\) => \{\n\s*if \(session\?\.user\) \{\n\s*setCurrentUserId\(session\.user\.id\);\n\s*\} else \{\n\s*setCurrentUserId\(null\);\n\s*\}\n\s*\}\);/m;

const replacement = `const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        fetchSupabaseUsers(); // Re-fetch to ensure the new user's profile is in the list
      } else {
        setCurrentUserId(null);
      }
    });`;

file = file.replace(regex, replacement);
fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Patched auth listener to refetch users!');
