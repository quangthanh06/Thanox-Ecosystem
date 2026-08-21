const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const regex = /const updateSettings = \([\s\S]*?showToast\('Ðã luu c?u hình h? th?ng thành công', 'success'\);\n  \};/m;
const match = file.match(regex);

if (match) {
  const replace = `const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('thanox_settings', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save settings to localStorage:', e);
      }
      
      supabase.from('settings').upsert({ id: 1, data: updated }).then(res => { 
        if (res.error) console.error('Settings Sync Error', res.error); 
      });
      
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updated }),
      }).catch((err) => console.error('Settings sync error:', err));
      return updated;
    });
    showToast('Ðã luu c?u hình h? th?ng thành công', 'success');
  };`;
  
  file = file.replace(regex, replace);
  fs.writeFileSync('src/context/StoreContext.tsx', file);
  console.log('Patched safely!');
} else {
  console.log('Not found!');
}
