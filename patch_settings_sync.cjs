const fs = require('fs');
let content = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

// 1. Add fetchSupabaseSettings to the useEffect that currently fetches products/categories/tickets
const fetchSettingsRegex = /const fetchSupabaseTickets = async \(\) => \{[\s\S]*?fetchSupabaseTickets\(\);\s*\};/m;
const fetchSettingsCode = `
    const fetchSupabaseSettings = async () => {
      try {
        const { data, error } = await supabase.from('store_settings').select('settings_data').eq('id', 'default').single();
        if (!error && data && data.settings_data) {
          setSettings((prev) => ({ ...prev, ...data.settings_data }));
        }
      } catch (err) {
        // ignore if table not created yet
      }
    };
    fetchSupabaseSettings();
`;

content = content.replace(/(fetchSupabaseTickets\(\);\s*\};)/, `$1\n${fetchSettingsCode}`);

// 2. Patch updateSettings
const updateSettingsRegex = /fetch\('\/api\/sync', \{[\s\S]*?err\)\);/m;
const updateSettingsSupabase = `
        // Sync to Supabase
        supabase.from('store_settings').upsert({
          id: 'default',
          settings_data: updated,
          updated_at: new Date().toISOString()
        }).catch(err => console.error('Failed to sync settings to cloud', err));
`;

content = content.replace(updateSettingsRegex, updateSettingsSupabase);

fs.writeFileSync('src/context/StoreContext.tsx', content, 'utf8');
console.log('Fixed Settings Sync');
