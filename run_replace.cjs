const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

file = file.replace(/createdAt: u\.created_at,\n                joinDate: new Date\(u\.created_at\)\.toISOString\(\)\.replace\('T', ' '\)\.substring\(0, 16\),/g, "createdAt: u.created_at,\n                joinDate: new Date(u.created_at).toISOString().replace('T', ' ').substring(0, 16),\n                name: u.username,\n                totalOrders: 0,\n                affiliateBalance: 0,\n                avatarText: u.username.substring(0, 2).toUpperCase(),");

fs.writeFileSync('src/context/StoreContext.tsx', file);
