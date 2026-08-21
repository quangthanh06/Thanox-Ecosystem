const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const regex = /try \{\n\s*localStorage\.setItem\('thanox_settings', JSON\.stringify\(updated\)\);\n\s*supabase\.from\('settings'\)\.upsert\(\{ id: 1, data: updated \}\)\.then\(res => \{ if \(res\.error\) console\.error\('Settings Sync Error', res\.error\); \}\);\n\s*\} catch \(e\) \{\n\s*console\.error\('Failed to save settings:', e\);\n\s*\}/m;

const replacement = `try {
          localStorage.setItem('thanox_settings', JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save settings to localStorage (Quota likely exceeded due to large Base64 images/audio):', e);
        }
        
        // Luôn luu lên Supabase dù localStorage có b? l?i dung lu?ng
        supabase.from('settings').upsert({ id: 1, data: updated }).then(res => { 
          if (res.error) console.error('Settings Sync Error', res.error); 
        });`;

if (file.match(regex)) {
  file = file.replace(regex, replacement);
  fs.writeFileSync('src/context/StoreContext.tsx', file);
  console.log('Patched updateSettings successfully!');
} else {
  console.log('Regex for updateSettings not found!');
}
