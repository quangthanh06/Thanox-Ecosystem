const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const regex = /localStorage\.setItem\('thanox_settings', JSON\.stringify\(updated\)\);\n\s*supabase\.from\('settings'\)\.upsert/g;
const replacement = `localStorage.setItem('thanox_settings', JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save settings:', e);
        }
        supabase.from('settings').upsert`;

if (file.match(regex)) {
  file = file.replace(regex, replacement);
  // Remove the old catch block
  file = file.replace(/ supabase\.from\('settings'\)\.upsert[\s\S]*?console\.error\('Failed to save settings:', e\);\n\s*\}/m, function(match) {
    return match.replace(/\} catch \(e\) \{\n\s*console\.error\('Failed to save settings:', e\);\n\s*\}/, '');
  });
  fs.writeFileSync('src/context/StoreContext.tsx', file);
  console.log('Patched!');
} else {
  console.log('Regex 4 not found!');
}
