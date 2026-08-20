const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const oldStr = `  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('thanox_settings', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updated }),
      }).catch((err) => console.error('Settings sync error:', err));
      return updated;
    });
    showToast('Ðã luu c?u hình h? th?ng thành công', 'success');
  };`;

const newStr = `  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('thanox_settings', JSON.stringify(updated));
        
        // Sync to Supabase
        supabase.from('settings').upsert({ id: 1, data: updated }).then(res => {
          if (res.error) console.error('L?i d?ng b? Settings lên Cloud:', res.error);
        });
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
      return updated;
    });
    showToast('Ðã luu c?u hình h? th?ng thành công', 'success');
  };`;

file = file.replace(oldStr, newStr);

fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Patched Settings 2!');
