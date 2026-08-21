const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const target = `    const updateSettings = (newSettings: Partial<StoreSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        try {
          localStorage.setItem('thanox_settings', JSON.stringify(updated));
          supabase.from('settings').upsert({ id: 1, data: updated }).then(res => { if (res.error) console.error('Settings Sync Error', res.error); });
        } catch (e) {
          console.error('Failed to save settings:', e);
        }`;

const replacement = `    const updateSettings = (newSettings: Partial<StoreSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        try {
          localStorage.setItem('thanox_settings', JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save settings:', e);
        }
        supabase.from('settings').upsert({ id: 1, data: updated }).then(res => { if (res.error) console.error('Settings Sync Error', res.error); });`;

if (file.includes(target)) {
  file = file.replace(target, replacement);
  fs.writeFileSync('src/context/StoreContext.tsx', file);
  console.log('Patched indexof!');
} else {
  console.log('Target string not found!');
}
