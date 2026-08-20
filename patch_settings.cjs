const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

// 1. Add fetchSupabaseSettings
const fetchSettingsCode = `
      const fetchSupabaseSettings = async () => {
        try {
          const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
          if (error && error.code !== 'PGRST116') throw error; // PGRST116 is row not found
          if (data && data.data) {
            setSettings(prev => ({ ...prev, ...data.data }));
          }
        } catch (err) { console.error('L?i t?i Settings:', err); }
      };
      fetchSupabaseSettings();
`;
file = file.replace('fetchSupabaseTransactions();\n    }, []);', 'fetchSupabaseTransactions();\n' + fetchSettingsCode + '\n    }, []);');

// 2. Modify updateSettings
file = file.replace(/const updateSettings = \(newSettings: Partial<StoreSettings>\) => \{[\s\S]*?localStorage\.setItem\('thanox_settings', JSON\.stringify\(updated\)\);[\s\S]*?return updated;\n    \}\);\n  \};/m, function(match) {
  return `const updateSettings = (newSettings: Partial<StoreSettings>) => {
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
  };`;
});

fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Patched Settings!');
