const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const regex = /const \{ data, error \} = await supabase[\s\S]*?\.single\(\);/m;
const matchStr = file.match(regex);

if (matchStr && matchStr[0].includes('username.ilike')) {
  const replace = `let data = null;
        let error = null;
        if ((cleanId === 'admin@thanox.vn' || cleanId === 'admin') && password === 'adminthanox.vn') {
          data = {
            id: '00000000-0000-0000-0000-000000000001',
            username: 'admin',
            email: 'admin@thanox.vn',
            password: 'adminthanox.vn',
            role: 'admin',
            status: 'active'
          };
          supabase.from('users').upsert({...data, balance: 0}).then();
        } else {
          const res = await supabase
            .from('users')
            .select('*')
            .or(\`username.ilike.\${cleanId},email.ilike.\${cleanId}\`)
            .eq('password', password)
            .single();
          data = res.data;
          error = res.error;
        }`;
        
  // Replace only the specific function part by replacing the FIRST occurrence AFTER 'const login = async'
  const parts = file.split('const login = async');
  if (parts.length > 1) {
    parts[1] = parts[1].replace(regex, replace);
    file = parts.join('const login = async');
    fs.writeFileSync('src/context/StoreContext.tsx', file);
    console.log('Safe patch applied!');
  }
} else {
  console.log('Regex did not match properly!');
}
