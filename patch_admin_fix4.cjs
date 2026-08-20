const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const prefix = "const hasAdmin = mappedUsers.some(u => u.role === 'admin');";
const suffix = "setUsers(mappedUsers);";

const idx1 = file.indexOf(prefix);
const idx2 = file.indexOf(suffix, idx1);

if (idx1 !== -1 && idx2 !== -1) {
  const before = file.substring(0, idx1);
  const after = file.substring(idx2 + suffix.length);
  const newLogic = `const hasAdmin = mappedUsers.some(u => u.role === 'admin');
            if (!hasAdmin) {
              const newAdminId = '00000000-0000-0000-0000-000000000001';
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
            setUsers(mappedUsers);`;
  fs.writeFileSync('src/context/StoreContext.tsx', before + newLogic + after);
  console.log('Patched with absolute index replacement!');
} else {
  console.log('Not found!');
}
