const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const parts = file.split('const updateSettings = (newSettings: Partial<StoreSettings>) => {');
if (parts.length > 1) {
  let funcBody = parts[1];
  funcBody = funcBody.replace(
    /try \{\s*localStorage\.setItem\('thanox_settings', JSON\.stringify\(updated\)\);\s*supabase\.from\('settings'\)\.upsert\(\{ id: 1, data: updated \}\)\.then\(res => \{ if \(res\.error\) console\.error\('Settings Sync Error', res\.error\); \}\);\s*\} catch \(e\) \{\s*console\.error\('Failed to save settings:', e\);\s*\}/,
    `try {
          localStorage.setItem('thanox_settings', JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save settings to local (Quota exceeded):', e);
        }
        
        // Supabase upsert is outside the try-catch so it always runs
        supabase.from('settings').upsert({ id: 1, data: updated }).then(res => { 
          if (res.error) console.error('Settings Sync Error', res.error); 
        });`
  );
  file = parts[0] + 'const updateSettings = (newSettings: Partial<StoreSettings>) => {' + funcBody;
  fs.writeFileSync('src/context/StoreContext.tsx', file);
  console.log('Patched final!');
}
