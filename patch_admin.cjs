const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const match = /setUsers\(mappedUsers\);\n\s*\}/;
const replace = `
            // T? d?ng khôi ph?c tài kho?n admin n?u database tr?ng (giúp user không b? khóa ngoài)
            const hasAdmin = mappedUsers.some(u => u.role === 'admin');
            if (!hasAdmin) {
              const defaultAdmin = INITIAL_USERS.find(u => u.role === 'admin');
              if (defaultAdmin) {
                mappedUsers.push(defaultAdmin);
                // Ð?y l?i lên Cloud ng?m
                supabase.from('users').upsert({
                  id: defaultAdmin.id,
                  username: defaultAdmin.username,
                  email: defaultAdmin.email,
                  password: defaultAdmin.password,
                  role: 'admin',
                  balance: 0,
                  status: 'active'
                }).then();
              }
            }
            
            setUsers(mappedUsers);
          }`;

file = file.replace(match, replace);
fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Patched Admin Auto-Restore!');
