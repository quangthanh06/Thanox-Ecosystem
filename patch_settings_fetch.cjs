const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const regex = /fetchSupabaseUsers\(\);\n\s*\}, \[\]\);/;
const replace = `fetchSupabaseUsers();
        
        // Fetch Settings from Supabase
        supabase.from('settings').select('*').eq('id', 1).single().then(({data}) => {
          if (data && data.data) {
            setSettings(prev => ({...prev, ...data.data}));
            localStorage.setItem('thanox_settings', JSON.stringify(data.data));
          }
        });
      }, []);`;

if (file.match(regex)) {
  file = file.replace(regex, replace);
  fs.writeFileSync('src/context/StoreContext.tsx', file);
  console.log('Patched Settings Fetch!');
} else {
  console.log('Could not find match for settings patch!');
}
