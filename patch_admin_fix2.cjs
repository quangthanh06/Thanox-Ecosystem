const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');
file = file.replace(/\r\n/g, '\n');

const match = /\/\/ T\? d\?ng kh.*?setUsers\(mappedUsers\);\n\s*\}/ms;
const match2 = /              \/\/ [^\n]*?kh[^\n]*?admin[^\n]*?\n\s*const hasAdmin = mappedUsers\.some\(u => u\.role === 'admin'\);\n\s*if \(\!hasAdmin\) \{[\s\S]*?setUsers\(mappedUsers\);\n\s*\}/ms;

const newLogic = `
            // Khoi phuc tai khoan admin mac dinh
            const hasAdmin = mappedUsers.some(u => u.role === 'admin');
            if (!hasAdmin) {
              const newAdminId = '00000000-0000-0000-0000-000000000001'; // Valid UUID
              const newAdmin = {
                id: newAdminId,
                username: 'admin',
                email: 'admin@thanox.vn',
                password: 'adminthanox.vn',
                role: 'admin',
                balance: 0,
                totalSpent: 0,
                status: 'active',
                createdAt: new Date().toISOString(),
                joinDate: new Date().toISOString().substring(0, 16),
              };
              mappedUsers.push(newAdmin);
              
              // Day len cloud
              supabase.from('users').upsert({
                id: newAdminId,
                username: newAdmin.username,
                email: newAdmin.email,
                password: newAdmin.password,
                role: 'admin',
                balance: 0,
                status: 'active'
              }).then();
            }
            
            setUsers(mappedUsers);
          }`;

if(file.match(match2)) {
  file = file.replace(match2, newLogic);
  fs.writeFileSync('src/context/StoreContext.tsx', file);
  console.log('Patched match2!');
} else {
  console.log('Failed to match!');
}
