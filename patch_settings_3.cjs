const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

file = file.replace(/localStorage\.setItem\('thanox_settings', JSON\.stringify\(updated\)\);/g, "localStorage.setItem('thanox_settings', JSON.stringify(updated));\n        supabase.from('settings').upsert({ id: 1, data: updated }).then(res => { if (res.error) console.error('Settings Sync Error', res.error); });");

fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Patched Settings 3!');
