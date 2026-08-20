const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const oldLogicRegex = /\/\/ T? d?ng khôi ph?c tài kho?n admin n?u database tr?ng[\s\S]*?setUsers\(mappedUsers\);\n\s*\}/;

const newLogic = `
            // T? d?ng khôi ph?c tài kho?n admin n?u database tr?ng (giúp user không b? khóa ngoài)
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
              
              // Ð?y l?i lên Cloud ng?m
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

if (file.match(oldLogicRegex)) {
  file = file.replace(oldLogicRegex, newLogic);
  fs.writeFileSync('src/context/StoreContext.tsx', file);
  console.log('Fixed Admin auto-restore with valid UUID and requested credentials!');
} else {
  console.log('Could not find the old logic block!');
}
